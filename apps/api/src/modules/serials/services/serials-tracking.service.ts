import { and, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { reviews } from "../../reviews/reviews.entity";
import { SerialsSeasonInteractionsRepository } from "../repositories/serials-season-interactions.repository";
import { SerialsEpisodeInteractionsRepository } from "../repositories/serials-episode-interactions.repository";
import { SerialsCacheService } from "./serials-cache.service";
import { resolveRatingOutOfTen } from "../../diary/helpers/diary-rating.helper";
import { toRatingOutOfFive } from "../helpers/serials-normalization.helper";
import { getSeriesSeasonDetails as tmdbGetSeasonDetails } from "../../../infrastructure/tmdb/serials";

export class SerialsTrackingService {
  static async updateSeasonInteraction(
    userId: string,
    tmdbId: number,
    seasonNumber: number,
    input: { watched?: boolean; liked?: boolean; ratingOutOfFive?: number | null },
  ) {
    const series = await SerialsCacheService.findOrCreate(tmdbId);
    if (!series) return null;

    const rating =
      input.ratingOutOfFive !== undefined
        ? (resolveRatingOutOfTen(input.ratingOutOfFive) ?? null)
        : undefined;

    const row = await SerialsSeasonInteractionsRepository.upsertSeasonInteraction({
      userId,
      seriesId: series.id,
      seasonNumber,
      watched: input.watched,
      liked: input.liked,
      rating,
    });

    if (!row) return null;

    if (input.watched !== undefined) {
      const tmdbSeasonDetail = await tmdbGetSeasonDetails(
        tmdbId,
        seasonNumber,
      ).catch(() => null);

      if (tmdbSeasonDetail && tmdbSeasonDetail.episodes) {
        await Promise.all(
          tmdbSeasonDetail.episodes.map((episode) =>
            SerialsEpisodeInteractionsRepository.upsertEpisodeInteraction({
              userId,
              seriesId: series.id,
              seasonNumber,
              episodeNumber: episode.episode_number,
              watched: input.watched,
            }),
          ),
        );
      }
    }

    return {
      watched: row.watched,
      liked: row.liked,
      ratingOutOfFive: toRatingOutOfFive(row.rating),
    };
  }

  static async updateEpisodeInteraction(
    userId: string,
    tmdbId: number,
    seasonNumber: number,
    episodeNumber: number,
    input: { watched?: boolean; liked?: boolean; ratingOutOfFive?: number | null },
  ) {
    const series = await SerialsCacheService.findOrCreate(tmdbId);
    if (!series) return null;

    const rating =
      input.ratingOutOfFive !== undefined
        ? (resolveRatingOutOfTen(input.ratingOutOfFive) ?? null)
        : undefined;

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

    return {
      watched: row.watched,
      liked: row.liked,
      ratingOutOfFive: toRatingOutOfFive(row.rating),
    };
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
    const [row] = await db
      .insert(reviews)
      .values({
        userId,
        mediaType: "tv_season",
        mediaSource: "tmdb",
        mediaSourceId,
        content: input.content,
        containsSpoilers: input.containsSpoilers ?? false,
      })
      .onConflictDoUpdate({
        target: [
          reviews.userId,
          reviews.mediaType,
          reviews.mediaSource,
          reviews.mediaSourceId,
        ],
        set: {
          content: input.content,
          containsSpoilers: input.containsSpoilers ?? false,
          updatedAt: new Date(),
        },
      })
      .returning();

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
    const [row] = await db
      .insert(reviews)
      .values({
        userId,
        mediaType: "tv_episode",
        mediaSource: "tmdb",
        mediaSourceId,
        content: input.content,
        containsSpoilers: input.containsSpoilers ?? false,
      })
      .onConflictDoUpdate({
        target: [
          reviews.userId,
          reviews.mediaType,
          reviews.mediaSource,
          reviews.mediaSourceId,
        ],
        set: {
          content: input.content,
          containsSpoilers: input.containsSpoilers ?? false,
          updatedAt: new Date(),
        },
      })
      .returning();

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
