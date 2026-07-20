import { and, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { reviews } from "../../reviews/reviews.entity";
import { SerialsSeasonInteractionsRepository } from "../repositories/serials-season-interactions.repository";
import { SerialsEpisodeInteractionsRepository } from "../repositories/serials-episode-interactions.repository";
import { SerialsCacheService } from "./serials-cache.service";
import { getSeriesSeasonDetails as tmdbGetSeasonDetails } from "../../../infrastructure/tmdb/serials";
import { SocialRepository } from "../../social/repositories/social.repository";
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
      }).catch(() => {});
    }

    if (input.rating !== undefined && input.rating !== null && row.rating !== null) {
      SocialRepository.insertActivity({
        userId,
        type: "liked_movie",
        entityId: String(series.id),
        metadata: JSON.stringify(buildSeasonRatingActivityMetadata({ series, seasonNumber, rating: row.rating })),
      }).catch(() => {});
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
      }).catch(() => {});
    }

    if (input.rating !== undefined && input.rating !== null && row.rating !== null) {
      SocialRepository.insertActivity({
        userId,
        type: "liked_movie",
        entityId: String(series.id),
        metadata: JSON.stringify(buildEpisodeRatingActivityMetadata({ series, seasonNumber, episodeNumber, rating: row.rating })),
      }).catch(() => {});
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
    const mediaSourceId = `${seriesTmdbId}:${seasonNumber}`;
    const [row] = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.mediaType, "tv_season"),
          eq(reviews.mediaSourceId, mediaSourceId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  static async upsertSeasonReview(
    userId: string,
    seriesTmdbId: number,
    seasonNumber: number,
    input: { content: string; containsSpoilers?: boolean },
  ) {
    const mediaSourceId = `${seriesTmdbId}:${seasonNumber}`;

    const [existing] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.mediaType, "tv_season"), eq(reviews.mediaSourceId, mediaSourceId)))
      .limit(1);
    const isNew = !existing;

    const [row] = await db
      .insert(reviews)
      .values({
        userId,
        mediaType: "tv_season",
        mediaSourceId,
        content: input.content,
        containsSpoilers: input.containsSpoilers ?? false,
      })
      .onConflictDoUpdate({
        target: [reviews.userId, reviews.mediaType, reviews.mediaSource, reviews.mediaSourceId],
        set: {
          content: input.content,
          containsSpoilers: input.containsSpoilers ?? false,
          updatedAt: new Date(),
        },
      })
      .returning();

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
          }).catch(() => {});
        }
      }).catch(() => {});
    }

    return row ?? null;
  }

  static async deleteSeasonReview(userId: string, seriesTmdbId: number, seasonNumber: number) {
    const mediaSourceId = `${seriesTmdbId}:${seasonNumber}`;
    const [deleted] = await db
      .delete(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.mediaType, "tv_season"),
          eq(reviews.mediaSourceId, mediaSourceId),
        ),
      )
      .returning();
    return deleted ?? null;
  }

  static async getEpisodeReview(
    userId: string,
    seriesTmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
  ) {
    const mediaSourceId = `${seriesTmdbId}:${seasonNumber}:${episodeNumber}`;
    const [row] = await db
      .select()
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.mediaType, "tv_episode"),
          eq(reviews.mediaSourceId, mediaSourceId),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  static async upsertEpisodeReview(
    userId: string,
    seriesTmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
    input: { content: string; containsSpoilers?: boolean },
  ) {
    const mediaSourceId = `${seriesTmdbId}:${seasonNumber}:${episodeNumber}`;

    const [existing] = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.mediaType, "tv_episode"), eq(reviews.mediaSourceId, mediaSourceId)))
      .limit(1);
    const isNew = !existing;

    const [row] = await db
      .insert(reviews)
      .values({
        userId,
        mediaType: "tv_episode",
        mediaSourceId,
        content: input.content,
        containsSpoilers: input.containsSpoilers ?? false,
      })
      .onConflictDoUpdate({
        target: [reviews.userId, reviews.mediaType, reviews.mediaSource, reviews.mediaSourceId],
        set: {
          content: input.content,
          containsSpoilers: input.containsSpoilers ?? false,
          updatedAt: new Date(),
        },
      })
      .returning();

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
          }).catch(() => {});
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
    const mediaSourceId = `${seriesTmdbId}:${seasonNumber}:${episodeNumber}`;
    const [deleted] = await db
      .delete(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.mediaType, "tv_episode"),
          eq(reviews.mediaSourceId, mediaSourceId),
        ),
      )
      .returning();
    return deleted ?? null;
  }
}
