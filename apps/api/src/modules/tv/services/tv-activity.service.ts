import type { UpdateSeriesInteractionDto } from "../dto/tv.dto";
import { ActivityRecorder } from "../../social/services/activity-recorder.service";
import { TvInteractionsRepository } from "../repositories/tv-interactions.repository";
import { TvCacheService } from "./tv-cache.service";
import { TvEpisodeInteractionsRepository } from "../repositories/tv-episode-interactions.repository";
import { TvSeasonInteractionsRepository } from "../repositories/tv-season-interactions.repository";
import { TvTrackingService } from "./tv-tracking.service";
import { TvWatchStatusService } from "./tv-watch-status.service";
import type { SeriesWatchStatus } from "../constants/tv-watch-status.constants";

export class TvActivityService {
  // Every regular season's episode numbers, resolved before any write so a
  // TMDB failure fails "mark series watched" / "log" outright instead of
  // saving some seasons and not others (#69).
  static async resolveSeasonEpisodeNumbers(series: {
    tmdbId: number;
    numberOfSeasons: number | null;
  }): Promise<Map<number, number[]>> {
    const seasonNumbers = Array.from(
      { length: Math.max(series.numberOfSeasons ?? 0, 0) },
      (_, index) => index + 1,
    );
    const episodeNumbers = await Promise.all(
      seasonNumbers.map((seasonNumber) =>
        TvTrackingService.getSeasonEpisodeNumbers(series.tmdbId, seasonNumber),
      ),
    );
    return new Map(seasonNumbers.map((seasonNumber, index) => [seasonNumber, episodeNumbers[index]!]));
  }

  // The sidebar "Watch" toggle and a Series log both say "I watched this", so
  // both cascade it to every season/episode, not just the series flag.
  static async cascadeSeasonsWatched(
    userId: string,
    series: { id: number; tmdbId: number },
    seasonEpisodeNumbers: Map<number, number[]> | null,
  ): Promise<void> {
    if (!seasonEpisodeNumbers) {
      await Promise.all([
        TvEpisodeInteractionsRepository.unwatchAllForSeries(userId, series.id),
        TvSeasonInteractionsRepository.unwatchAllForSeries(userId, series.id),
      ]);
      return;
    }

    await Promise.all(
      [...seasonEpisodeNumbers].map(([seasonNumber, episodeNumbers]) =>
        TvTrackingService.updateSeasonInteraction(
          userId,
          series.tmdbId,
          seasonNumber,
          { watched: true },
          { syncWatchStatus: false, episodeNumbers },
        ),
      ),
    );
  }

  static async getInteraction(userId: string, tmdbId: number) {
    const series = await TvCacheService.findOrCreate(tmdbId);
    if (!series) {
      return null;
    }

    const row = await TvInteractionsRepository.getInteractionRow(userId, series.id);
    return TvActivityService.toInteractionState(row, row?.watchStatus ?? null);
  }

  private static toInteractionState(
    row: { liked: boolean; watchlisted: boolean; rating: number | null } | null,
    watchStatus: SeriesWatchStatus | null,
  ) {
    return {
      liked: row?.liked ?? false,
      watchlisted: row?.watchlisted ?? false,
      rating: row?.rating ?? null,
      watched: watchStatus === "completed",
      watchStatus,
    };
  }

  static async updateInteraction(
    userId: string,
    tmdbId: number,
    input: UpdateSeriesInteractionDto,
  ) {
    const series = await TvCacheService.findOrCreate(tmdbId);
    if (!series) {
      return null;
    }

    const previousRow = await TvInteractionsRepository.getInteractionRow(userId, series.id);
    const previousLiked = previousRow?.liked ?? false;
    const previousWatchlisted = previousRow?.watchlisted ?? false;
    const previousStatus = previousRow?.watchStatus ?? null;

    // Only an explicit watched toggle cascades (even to the same value -
    // matches the sidebar toggle). Liking or rating a series says nothing
    // about which episodes were seen, so it leaves them and the status alone (#66).
    const cascadeTarget = input.watched;

    let watchStatus = previousStatus;
    if (cascadeTarget !== undefined) {
      await TvActivityService.cascadeSeasonsWatched(
        userId,
        series,
        cascadeTarget ? await TvActivityService.resolveSeasonEpisodeNumbers(series) : null,
      );
      watchStatus = cascadeTarget ? "completed" : null;
    } else if (input.watchStatus !== undefined) {
      watchStatus = await TvWatchStatusService.setUserStatus(userId, series, input.watchStatus);
    }

    // `watched` still goes through so marking a series watched clears its
    // watchlist flag, same as for movies.
    const hasRowChange =
      input.liked !== undefined ||
      input.watchlisted !== undefined ||
      input.rating !== undefined ||
      cascadeTarget !== undefined;

    const [row] = await Promise.all([
      hasRowChange
        ? TvInteractionsRepository.upsertInteraction({
            userId,
            seriesId: series.id,
            liked: input.liked,
            watchlisted: input.watchlisted,
            rating: input.rating,
            watched: cascadeTarget,
          })
        : previousRow,
      cascadeTarget !== undefined
        ? TvWatchStatusService.setStatus(userId, series.id, watchStatus)
        : null,
    ]);

    const resolvedLiked = row?.liked ?? input.liked ?? previousLiked;
    const resolvedWatchlisted =
      row?.watchlisted ?? input.watchlisted ?? previousWatchlisted;

    if (input.liked === true && !previousLiked && resolvedLiked) {
      ActivityRecorder.recordMedia({
        userId,
        subject: { kind: "series", series },
        type: "liked_movie",
        entityId: String(series.id),
      });
    }

    if (input.watchlisted === true && !previousWatchlisted && resolvedWatchlisted) {
      ActivityRecorder.recordMedia({
        userId,
        subject: { kind: "series", series },
        type: "watchlisted_movie",
        entityId: String(series.id),
      });
    }

    // Undoing a like or watchlist takes its feed row back out (#76).
    await Promise.all([
      input.liked === false && previousLiked
        ? ActivityRecorder.retractMedia({
            userId,
            subject: { kind: "series", series },
            type: "liked_movie",
            entityId: String(series.id),
          })
        : null,
      input.watchlisted === false && previousWatchlisted
        ? ActivityRecorder.retractMedia({
            userId,
            subject: { kind: "series", series },
            type: "watchlisted_movie",
            entityId: String(series.id),
          })
        : null,
    ]);

    return TvActivityService.toInteractionState(
      row && { liked: resolvedLiked, watchlisted: resolvedWatchlisted, rating: row.rating },
      watchStatus,
    );
  }

  static async getMyLogs(userId: string, limit?: number, offset?: number) {
    return TvInteractionsRepository.findAllDiaryByUser(userId, limit, offset);
  }

  // The same end state as the sidebar "Watch" toggle turned off: no season or
  // episode marked, no watch status. Like and rating stay.
  static async unwatchSeries(userId: string, seriesId: number) {
    await Promise.all([
      TvEpisodeInteractionsRepository.unwatchAllForSeries(userId, seriesId),
      TvSeasonInteractionsRepository.unwatchAllForSeries(userId, seriesId),
    ]);
    await Promise.all([
      TvInteractionsRepository.upsertInteraction({ userId, seriesId, watched: false }),
      TvWatchStatusService.setStatus(userId, seriesId, null),
    ]);
  }

  // A review says it was watched, so it leaves the Watchlist as a Film does,
  // but a review mid-season mustn't knock the series off "watching".
  static async markReviewed(userId: string, seriesId: number) {
    await Promise.all([
      TvWatchStatusService.markCompletedIfUntracked(userId, seriesId),
      TvInteractionsRepository.upsertInteraction({ userId, seriesId, watched: true }),
    ]);
  }

  static async getLogs(seriesId: number, limit?: number, offset?: number) {
    return TvInteractionsRepository.getLogsBySeriesId(seriesId, limit, offset);
  }
}
