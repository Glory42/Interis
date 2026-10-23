import type {
  CreateSerialLogDto,
  UpdateSerialInteractionDto,
  UpdateSerialLogDto,
} from "../dto/serials.dto";
import { buildDiaryEntryExtraMetadata } from "../helpers/serials-activity.helper";
import { ActivityRecorder } from "../../social/services/activity-recorder.service";
import { SerialsInteractionsRepository } from "../repositories/serials-interactions.repository";
import { SerialsReviewsRepository } from "../repositories/serials-reviews.repository";
import { SerialsCacheService } from "./serials-cache.service";
import { SerialsEpisodeInteractionsRepository } from "../repositories/serials-episode-interactions.repository";
import { SerialsSeasonInteractionsRepository } from "../repositories/serials-season-interactions.repository";
import { SerialsTrackingService } from "./serials-tracking.service";
import { SerialsWatchStatusService } from "./serials-watch-status.service";
import type { SerialWatchStatus } from "../constants/serials-watch-status.constants";

export class SerialsActivityService {
  // Every regular season's episode numbers, resolved before any write so a
  // TMDB failure fails "mark series watched" / "log" outright instead of
  // saving some seasons and not others (#69).
  private static async resolveSeasonEpisodeNumbers(series: {
    tmdbId: number;
    numberOfSeasons: number | null;
  }): Promise<Map<number, number[]>> {
    const seasonNumbers = Array.from(
      { length: Math.max(series.numberOfSeasons ?? 0, 0) },
      (_, index) => index + 1,
    );
    const episodeNumbers = await Promise.all(
      seasonNumbers.map((seasonNumber) =>
        SerialsTrackingService.getSeasonEpisodeNumbers(series.tmdbId, seasonNumber),
      ),
    );
    return new Map(seasonNumbers.map((seasonNumber, index) => [seasonNumber, episodeNumbers[index]!]));
  }

  // Shared by updateInteraction (the sidebar "Watch" toggle) and createLog
  // (the "Log" modal) - both are ways for the user to say "I watched this
  // series," so both must cascade the same watched state down to every
  // season/episode instead of only flipping the series-level flag.
  private static async cascadeSeasonsWatched(
    userId: string,
    series: { id: number; tmdbId: number },
    seasonEpisodeNumbers: Map<number, number[]> | null,
  ): Promise<void> {
    if (!seasonEpisodeNumbers) {
      await Promise.all([
        SerialsEpisodeInteractionsRepository.unwatchAllForSeries(userId, series.id),
        SerialsSeasonInteractionsRepository.unwatchAllForSeries(userId, series.id),
      ]);
      return;
    }

    await Promise.all(
      [...seasonEpisodeNumbers].map(([seasonNumber, episodeNumbers]) =>
        SerialsTrackingService.updateSeasonInteraction(
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
    const series = await SerialsCacheService.findOrCreate(tmdbId);
    if (!series) {
      return null;
    }

    const row = await SerialsInteractionsRepository.getInteractionRow(userId, series.id);
    return SerialsActivityService.toInteractionState(row, row?.watchStatus ?? null);
  }

  private static toInteractionState(
    row: { liked: boolean; watchlisted: boolean; rating: number | null } | null,
    watchStatus: SerialWatchStatus | null,
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
    input: UpdateSerialInteractionDto,
  ) {
    const series = await SerialsCacheService.findOrCreate(tmdbId);
    if (!series) {
      return null;
    }

    const previousRow = await SerialsInteractionsRepository.getInteractionRow(userId, series.id);
    const previousLiked = previousRow?.liked ?? false;
    const previousWatchlisted = previousRow?.watchlisted ?? false;
    const previousStatus = previousRow?.watchStatus ?? null;

    // Only an explicit watched toggle cascades (even to the same value -
    // matches the sidebar toggle). Liking or rating a series says nothing
    // about which episodes were seen, so it leaves them and the status alone (#66).
    const cascadeTarget = input.watched;

    let watchStatus = previousStatus;
    if (cascadeTarget !== undefined) {
      await SerialsActivityService.cascadeSeasonsWatched(
        userId,
        series,
        cascadeTarget ? await SerialsActivityService.resolveSeasonEpisodeNumbers(series) : null,
      );
      watchStatus = cascadeTarget ? "completed" : null;
    } else if (input.watchStatus !== undefined) {
      watchStatus = await SerialsWatchStatusService.setUserStatus(userId, series, input.watchStatus);
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
        ? SerialsInteractionsRepository.upsertInteraction({
            userId,
            seriesId: series.id,
            liked: input.liked,
            watchlisted: input.watchlisted,
            rating: input.rating,
            watched: cascadeTarget,
          })
        : previousRow,
      cascadeTarget !== undefined
        ? SerialsWatchStatusService.setStatus(userId, series.id, watchStatus)
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

    return SerialsActivityService.toInteractionState(
      row && { liked: resolvedLiked, watchlisted: resolvedWatchlisted, rating: row.rating },
      watchStatus,
    );
  }

  static async createLog(userId: string, tmdbId: number, input: CreateSerialLogDto) {
    const series = await SerialsCacheService.findOrCreate(tmdbId);
    if (!series) {
      return null;
    }

    const rating = input.rating ?? null;
    const rewatch = input.rewatch ?? false;
    const seasonEpisodeNumbers = await SerialsActivityService.resolveSeasonEpisodeNumbers(series);

    const entry = await SerialsInteractionsRepository.insertDiaryEntry({
      userId,
      seriesId: series.id,
      watchedDate: input.watchedDate,
      rating: rating,
      rewatch,
    });

    if (!entry) {
      throw new Error("Failed to create serial diary entry");
    }

    const reviewContent = input.review?.trim();

    let review:
      | {
          id: string;
          content: string;
          containsSpoilers: boolean;
        }
      | null = null;

    if (reviewContent) {
      review = await SerialsReviewsRepository.upsertReview({
        userId,
        seriesTmdbId: series.tmdbId,
        diaryEntryId: entry.id,
        content: reviewContent,
        containsSpoilers: input.containsSpoilers ?? false,
      });
    }

    ActivityRecorder.recordMedia({
      userId,
      subject: { kind: "series", series },
      type: "diary_entry",
      entityId: entry.id,
      extraMetadata: buildDiaryEntryExtraMetadata({ rating, rewatch, review }),
    });

    await Promise.all([
      SerialsWatchStatusService.setStatus(userId, series.id, "completed"),
      SerialsActivityService.cascadeSeasonsWatched(userId, series, seasonEpisodeNumbers),
    ]);

    return { entry, series, review };
  }

  static async getMyLogs(userId: string, limit?: number, offset?: number) {
    return SerialsInteractionsRepository.findAllDiaryByUser(userId, limit, offset);
  }

  static async updateLog(entryId: string, userId: string, input: UpdateSerialLogDto) {
    return SerialsInteractionsRepository.updateDiaryEntry(entryId, userId, {
      watchedDate: input.watchedDate,
      rating: input.rating,
      rewatch: input.rewatch,
    });
  }

  static async deleteLog(entryId: string, userId: string) {
    return SerialsInteractionsRepository.deleteDiaryEntry(entryId, userId);
  }

  static async getLogs(seriesId: number, limit?: number, offset?: number) {
    return SerialsInteractionsRepository.getLogsBySeriesId(seriesId, limit, offset);
  }
}
