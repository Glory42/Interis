import { SerialsSeasonInteractionsRepository } from "../repositories/serials-season-interactions.repository";
import { SerialsEpisodeInteractionsRepository } from "../repositories/serials-episode-interactions.repository";
import { SerialsSeasonEpisodeReviewsRepository } from "../repositories/serials-season-episode-reviews.repository";
import { SerialsCacheService } from "./serials-cache.service";
import { getSeriesSeasonDetails as tmdbGetSeasonDetails } from "../../../infrastructure/tmdb/serials";
import { ActivityRecorder } from "../../social/services/activity-recorder.service";
import { buildReviewExtraMetadata } from "../helpers/serials-activity.helper";
import { isNonSpecialSeasonNumber } from "../constants/serials-season.constants";
import { SerialsWatchStatusService } from "./serials-watch-status.service";
import { resolveEpisodeWatchedUpdate } from "../helpers/serials-implicit-watched.helper";
import { ServiceUnavailableError } from "../../../commons/errors/app-error";

export class SerialsTrackingService {
  // The episode numbers a "mark season watched" cascade checks. Resolved
  // before anything is written, so a TMDB failure fails the request instead
  // of saving the season flag with no episodes behind it (#69).
  static async getSeasonEpisodeNumbers(tmdbId: number, seasonNumber: number): Promise<number[]> {
    const detail = await tmdbGetSeasonDetails(tmdbId, seasonNumber).catch(() => null);
    if (!detail) {
      throw new ServiceUnavailableError(
        "Couldn't load this season's episodes right now. Please try again.",
      );
    }
    return (detail.episodes ?? []).map((episode) => episode.episode_number);
  }

  static async updateSeasonInteraction(
    userId: string,
    tmdbId: number,
    seasonNumber: number,
    input: { watched?: boolean; liked?: boolean; rating?: number | null },
    options: {
      // The whole-series cascade sets the status itself once, instead of
      // every season re-syncing it in parallel.
      syncWatchStatus?: boolean;
      // Pre-resolved by a caller cascading several seasons at once.
      episodeNumbers?: number[];
    } = {},
  ) {
    const series = await SerialsCacheService.findOrCreate(tmdbId);
    if (!series) return null;

    const episodeNumbers =
      input.watched === true
        ? (options.episodeNumbers ??
          (await SerialsTrackingService.getSeasonEpisodeNumbers(tmdbId, seasonNumber)))
        : [];

    const previousRow = await SerialsSeasonInteractionsRepository.getSingleInteraction(userId, series.id, seasonNumber);
    const previousLiked = previousRow?.liked ?? false;

    const rating = input.rating;

    const row = await SerialsSeasonInteractionsRepository.upsertSeasonInteraction({
      userId,
      seriesId: series.id,
      seasonNumber,
      watched: input.watched,
      liked: input.liked,
      rating,
    });

    if (!row) return null;

    if (input.liked === true && !previousLiked && row.liked) {
      ActivityRecorder.recordMedia({
        userId,
        subject: { kind: "season", series, seasonNumber },
        type: "liked_movie",
        entityId: String(series.id),
      });
    }

    if (
      input.rating !== undefined &&
      input.rating !== null &&
      row.rating !== null &&
      row.rating !== previousRow?.rating
    ) {
      ActivityRecorder.recordMedia({
        userId,
        subject: { kind: "season", series, seasonNumber },
        type: "liked_movie",
        entityId: String(series.id),
        extraMetadata: { rating: row.rating },
      });
    }

    // Only an explicit toggle cascades. Re-cascading whenever the stored flag
    // is true would mark newly aired episodes watched on a later like or
    // rating of an already-watched season (#70). Unwatching needs no episode
    // list from TMDB: it clears whatever rows the season has.
    if (input.watched === true) {
      await SerialsEpisodeInteractionsRepository.upsertManyEpisodeWatchedState({
        userId,
        seriesId: series.id,
        seasonNumber,
        episodeNumbers,
        watched: true,
      });
    } else if (input.watched === false) {
      await SerialsEpisodeInteractionsRepository.unwatchSeason(userId, series.id, seasonNumber);
    }

    if (
      options.syncWatchStatus !== false &&
      isNonSpecialSeasonNumber(seasonNumber) &&
      (input.watched !== undefined || row.watched !== (previousRow?.watched ?? false))
    ) {
      await SerialsWatchStatusService.syncFromEpisodes(userId, series, {
        episodeAdded: row.watched,
      });
    }

    return {
      watched: row.watched,
      liked: row.liked,
      rating: row.rating,
    };
  }

  static async updateEpisodeInteraction(
    userId: string,
    tmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
    input: { watched?: boolean; liked?: boolean; rating?: number | null },
  ) {
    const series = await SerialsCacheService.findOrCreate(tmdbId);
    if (!series) return null;

    const previousRow = await SerialsEpisodeInteractionsRepository.getSingleInteraction(userId, series.id, seasonNumber, episodeNumber);
    const previousLiked = previousRow?.liked ?? false;

    const rating = input.rating;

    const row = await SerialsEpisodeInteractionsRepository.upsertEpisodeInteraction({
      userId,
      seriesId: series.id,
      seasonNumber,
      episodeNumber,
      watched: resolveEpisodeWatchedUpdate(previousRow, input),
      liked: input.liked,
      rating,
    });

    if (!row) return null;

    if (input.liked === true && !previousLiked && row.liked) {
      ActivityRecorder.recordMedia({
        userId,
        subject: { kind: "episode", series, seasonNumber, episodeNumber },
        type: "liked_movie",
        entityId: String(series.id),
      });
    }

    if (
      input.rating !== undefined &&
      input.rating !== null &&
      row.rating !== null &&
      row.rating !== previousRow?.rating
    ) {
      ActivityRecorder.recordMedia({
        userId,
        subject: { kind: "episode", series, seasonNumber, episodeNumber },
        type: "liked_movie",
        entityId: String(series.id),
        extraMetadata: { rating: row.rating },
      });
    }

    const watchedChanged = row.watched !== (previousRow?.watched ?? false);
    await Promise.all([
      watchedChanged
        ? SerialsTrackingService.syncSeasonWatchedFromEpisodes(
            userId,
            tmdbId,
            series.id,
            seasonNumber,
            row.watched,
          )
        : null,
      watchedChanged && isNonSpecialSeasonNumber(seasonNumber)
        ? SerialsWatchStatusService.syncFromEpisodes(userId, series, {
            episodeAdded: row.watched,
          })
        : null,
    ]);

    return {
      watched: row.watched,
      liked: row.liked,
      rating: row.rating,
    };
  }

  // Toggling episodes one by one never touches the season's own watched
  // flag, which otherwise only gets set by the season-level "Watch" toggle
  // (updateSeasonInteraction) - so a season fully watched episode-by-episode
  // stays stuck showing "Unwatched". Recomputes and persists the season flag
  // from actual episode state after every episode toggle, so it's always a
  // derived, correct reflection of episode completion rather than two
  // independently-writable flags that can drift apart.
  private static async syncSeasonWatchedFromEpisodes(
    userId: string,
    tmdbId: number,
    seriesId: number,
    seasonNumber: number,
    episodeWatched: boolean,
  ): Promise<void> {
    const tmdbSeasonDetail = await tmdbGetSeasonDetails(tmdbId, seasonNumber).catch(() => null);
    if (!tmdbSeasonDetail) {
      // Without the episode list we can't tell whether the season is now
      // complete, but an unchecked episode always means it isn't (#69).
      if (!episodeWatched) {
        await SerialsSeasonInteractionsRepository.upsertSeasonInteraction({
          userId,
          seriesId,
          seasonNumber,
          watched: false,
        });
      }
      return;
    }
    if (!tmdbSeasonDetail.episodes || tmdbSeasonDetail.episodes.length === 0) {
      return;
    }

    const episodeInteractions = await SerialsEpisodeInteractionsRepository.getViewerEpisodeInteractions(
      userId,
      seriesId,
      tmdbId,
      seasonNumber,
    );
    const watchedEpisodeNumbers = new Set(
      episodeInteractions.filter((interaction) => interaction.watched).map((interaction) => interaction.episodeNumber),
    );
    const allEpisodesWatched = tmdbSeasonDetail.episodes.every((episode) =>
      watchedEpisodeNumbers.has(episode.episode_number),
    );

    await SerialsSeasonInteractionsRepository.upsertSeasonInteraction({
      userId,
      seriesId,
      seasonNumber,
      watched: allEpisodesWatched,
    });
  }

  static async getSeasonReview(userId: string, seriesTmdbId: number, seasonNumber: number) {
    return SerialsSeasonEpisodeReviewsRepository.getSeasonReview(userId, seriesTmdbId, seasonNumber);
  }

  static async upsertSeasonReview(
    userId: string,
    seriesTmdbId: number,
    seasonNumber: number,
    input: { content: string; containsSpoilers?: boolean },
  ) {
    const { row, isNew } = await SerialsSeasonEpisodeReviewsRepository.upsertSeasonReview(
      userId,
      seriesTmdbId,
      seasonNumber,
      input,
    );

    if (isNew && row) {
      const series = await SerialsCacheService.findOrCreate(seriesTmdbId).catch(() => null);
      if (series) {
        ActivityRecorder.recordMedia({
          userId,
          subject: { kind: "season", series, seasonNumber },
          type: "review",
          entityId: row.id,
          extraMetadata: buildReviewExtraMetadata({
            id: row.id,
            content: row.content,
            containsSpoilers: row.containsSpoilers,
          }),
        });
      }
    }

    return row ?? null;
  }

  static async deleteSeasonReview(userId: string, seriesTmdbId: number, seasonNumber: number) {
    return SerialsSeasonEpisodeReviewsRepository.deleteSeasonReview(userId, seriesTmdbId, seasonNumber);
  }

  static async getEpisodeReview(
    userId: string,
    seriesTmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
  ) {
    return SerialsSeasonEpisodeReviewsRepository.getEpisodeReview(
      userId,
      seriesTmdbId,
      seasonNumber,
      episodeNumber,
    );
  }

  static async upsertEpisodeReview(
    userId: string,
    seriesTmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
    input: { content: string; containsSpoilers?: boolean },
  ) {
    const { row, isNew } = await SerialsSeasonEpisodeReviewsRepository.upsertEpisodeReview(
      userId,
      seriesTmdbId,
      seasonNumber,
      episodeNumber,
      input,
    );

    if (isNew && row) {
      const series = await SerialsCacheService.findOrCreate(seriesTmdbId).catch(() => null);
      if (series) {
        ActivityRecorder.recordMedia({
          userId,
          subject: { kind: "episode", series, seasonNumber, episodeNumber },
          type: "review",
          entityId: row.id,
          extraMetadata: buildReviewExtraMetadata({
            id: row.id,
            content: row.content,
            containsSpoilers: row.containsSpoilers,
          }),
        });
      }
    }

    return row ?? null;
  }

  static async deleteEpisodeReview(
    userId: string,
    seriesTmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
  ) {
    return SerialsSeasonEpisodeReviewsRepository.deleteEpisodeReview(
      userId,
      seriesTmdbId,
      seasonNumber,
      episodeNumber,
    );
  }
}
