import { SerialsSeasonInteractionsRepository } from "../repositories/serials-season-interactions.repository";
import { SerialsEpisodeInteractionsRepository } from "../repositories/serials-episode-interactions.repository";
import { SerialsSeasonEpisodeReviewsRepository } from "../repositories/serials-season-episode-reviews.repository";
import { SerialsCacheService } from "./serials-cache.service";
import { getSeriesSeasonDetails as tmdbGetSeasonDetails } from "../../../infrastructure/tmdb/serials";
import { ActivityRecorder } from "../../social/services/activity-recorder.service";
import { buildReviewExtraMetadata } from "../helpers/serials-activity.helper";

export class SerialsTrackingService {
  static async updateSeasonInteraction(
    userId: string,
    tmdbId: number,
    seasonNumber: number,
    input: { watched?: boolean; liked?: boolean; rating?: number | null },
    options: { recordWatchedActivity?: boolean } = {},
  ) {
    const { recordWatchedActivity = true } = options;
    const series = await SerialsCacheService.findOrCreate(tmdbId);
    if (!series) return null;

    const previousRow = await SerialsSeasonInteractionsRepository.getSingleInteraction(userId, series.id, seasonNumber);
    const previousLiked = previousRow?.liked ?? false;
    const previousWatched = previousRow?.watched ?? false;

    const rating = input.rating;

    // Implicit-watch resolution (liking/rating marks watched) lives inside
    // upsertSeasonInteraction now - pass raw intent.
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

    if (
      recordWatchedActivity &&
      input.watched === true &&
      !previousWatched &&
      row.watched
    ) {
      ActivityRecorder.recordMedia({
        userId,
        subject: { kind: "season", series, seasonNumber },
        type: "watched_movie",
        entityId: String(series.id),
      });
    }

    if (input.watched === false || row.watched) {
      const targetWatchState = row.watched;
      const tmdbSeasonDetail = await tmdbGetSeasonDetails(
        tmdbId,
        seasonNumber,
      ).catch(() => null);

      if (tmdbSeasonDetail && tmdbSeasonDetail.episodes) {
        await SerialsEpisodeInteractionsRepository.upsertManyEpisodeWatchedState({
          userId,
          seriesId: series.id,
          seasonNumber,
          episodeNumbers: tmdbSeasonDetail.episodes.map((episode) => episode.episode_number),
          watched: targetWatchState,
        });
      }
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
    const previousWatched = previousRow?.watched ?? false;

    const rating = input.rating;

    // Implicit-watch resolution (liking/rating marks watched) lives inside
    // upsertEpisodeInteraction now - pass raw intent.
    const row = await SerialsEpisodeInteractionsRepository.upsertEpisodeInteraction({
      userId,
      seriesId: series.id,
      seasonNumber,
      episodeNumber,
      watched: input.watched,
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

    if (input.watched === true && !previousWatched && row.watched) {
      ActivityRecorder.recordMedia({
        userId,
        subject: { kind: "episode", series, seasonNumber, episodeNumber },
        type: "watched_movie",
        entityId: String(series.id),
      });
    }

    if (input.watched !== undefined) {
      await SerialsTrackingService.syncSeasonWatchedFromEpisodes(
        userId,
        tmdbId,
        series.id,
        seasonNumber,
      );
    }

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
  ): Promise<void> {
    const tmdbSeasonDetail = await tmdbGetSeasonDetails(tmdbId, seasonNumber).catch(() => null);
    if (!tmdbSeasonDetail || !tmdbSeasonDetail.episodes || tmdbSeasonDetail.episodes.length === 0) {
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
