import { SerialsSeasonInteractionsRepository } from "../repositories/serials-season-interactions.repository";
import { SerialsEpisodeInteractionsRepository } from "../repositories/serials-episode-interactions.repository";
import { SerialsSeasonEpisodeReviewsRepository } from "../repositories/serials-season-episode-reviews.repository";
import { SerialsCacheService } from "./serials-cache.service";
import { getSeriesSeasonDetails as tmdbGetSeasonDetails } from "../../../infrastructure/tmdb/serials";
import { SocialRepository } from "../../social/repositories/social.repository";
import { SocialFeedService } from "../../social/services/social-feed.service";
import {
  buildSeasonLikedActivityMetadata,
  buildEpisodeLikedActivityMetadata,
  buildSeasonReviewActivityMetadata,
  buildEpisodeReviewActivityMetadata,
  buildSeasonRatingActivityMetadata,
  buildEpisodeRatingActivityMetadata,
} from "../helpers/serials-activity.helper";

export class SerialsTrackingService {
  static async updateSeasonInteraction(
    userId: string,
    tmdbId: number,
    seasonNumber: number,
    input: { watched?: boolean; liked?: boolean; rating?: number | null },
  ) {
    const series = await SerialsCacheService.findOrCreate(tmdbId);
    if (!series) return null;

    const previousRow = await SerialsSeasonInteractionsRepository.getSingleInteraction(userId, series.id, seasonNumber);
    const previousLiked = previousRow?.liked ?? false;

    const rating = input.rating;
    const isImplicitlyWatched =
      input.liked === true ||
      (input.rating !== undefined && input.rating !== null);

    const row = await SerialsSeasonInteractionsRepository.upsertSeasonInteraction({
      userId,
      seriesId: series.id,
      seasonNumber,
      watched: input.watched !== undefined ? input.watched : (isImplicitlyWatched ? true : undefined),
      liked: input.liked,
      rating,
    });

    if (!row) return null;

    if (input.liked === true && !previousLiked && row.liked) {
      SocialRepository.insertActivity({
        userId,
        type: "liked_movie",
        entityId: String(series.id),
        metadata: JSON.stringify(buildSeasonLikedActivityMetadata({ series, seasonNumber })),
      })
        .then(() => SocialFeedService.invalidateFollowingFeed(userId))
        .catch(() => {});
    }

    if (
      input.rating !== undefined &&
      input.rating !== null &&
      row.rating !== null &&
      row.rating !== previousRow?.rating
    ) {
      SocialRepository.insertActivity({
        userId,
        type: "liked_movie",
        entityId: String(series.id),
        metadata: JSON.stringify(buildSeasonRatingActivityMetadata({ series, seasonNumber, rating: row.rating })),
      })
        .then(() => SocialFeedService.invalidateFollowingFeed(userId))
        .catch(() => {});
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

    const rating = input.rating;
    const isImplicitlyWatched =
      input.liked === true ||
      (input.rating !== undefined && input.rating !== null);

    const row = await SerialsEpisodeInteractionsRepository.upsertEpisodeInteraction({
      userId,
      seriesId: series.id,
      seasonNumber,
      episodeNumber,
      watched: input.watched !== undefined ? input.watched : (isImplicitlyWatched ? true : undefined),
      liked: input.liked,
      rating,
    });

    if (!row) return null;

    if (input.liked === true && !previousLiked && row.liked) {
      SocialRepository.insertActivity({
        userId,
        type: "liked_movie",
        entityId: String(series.id),
        metadata: JSON.stringify(buildEpisodeLikedActivityMetadata({ series, seasonNumber, episodeNumber })),
      })
        .then(() => SocialFeedService.invalidateFollowingFeed(userId))
        .catch(() => {});
    }

    if (
      input.rating !== undefined &&
      input.rating !== null &&
      row.rating !== null &&
      row.rating !== previousRow?.rating
    ) {
      SocialRepository.insertActivity({
        userId,
        type: "liked_movie",
        entityId: String(series.id),
        metadata: JSON.stringify(buildEpisodeRatingActivityMetadata({ series, seasonNumber, episodeNumber, rating: row.rating })),
      })
        .then(() => SocialFeedService.invalidateFollowingFeed(userId))
        .catch(() => {});
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
      SerialsCacheService.findOrCreate(seriesTmdbId).then((series) => {
        if (series) {
          SocialRepository.insertActivity({
            userId,
            type: "review",
            entityId: row.id,
            metadata: JSON.stringify(buildSeasonReviewActivityMetadata({
              series,
              seasonNumber,
              review: { id: row.id, content: row.content, containsSpoilers: row.containsSpoilers },
            })),
          })
            .then(() => SocialFeedService.invalidateFollowingFeed(userId))
            .catch(() => {});
        }
      }).catch(() => {});
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
      SerialsCacheService.findOrCreate(seriesTmdbId).then((series) => {
        if (series) {
          SocialRepository.insertActivity({
            userId,
            type: "review",
            entityId: row.id,
            metadata: JSON.stringify(buildEpisodeReviewActivityMetadata({
              series,
              seasonNumber,
              episodeNumber,
              review: { id: row.id, content: row.content, containsSpoilers: row.containsSpoilers },
            })),
          })
            .then(() => SocialFeedService.invalidateFollowingFeed(userId))
            .catch(() => {});
        }
      }).catch(() => {});
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
