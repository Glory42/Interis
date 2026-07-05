import { eq, and, like } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { serialEpisodeInteractions } from "../serials.entity";
import { reviews } from "../../reviews/reviews.entity";

export class SerialsEpisodeInteractionsRepository {
  static async getViewerEpisodeInteractions(
    userId: string,
    seriesId: number,
    seriesTmdbId: number,
    seasonNumber: number,
  ) {
    const interactions = await db
      .select()
      .from(serialEpisodeInteractions)
      .where(
        and(
          eq(serialEpisodeInteractions.userId, userId),
          eq(serialEpisodeInteractions.seriesId, seriesId),
          eq(serialEpisodeInteractions.seasonNumber, seasonNumber),
        ),
      );

    const userReviews = await db
      .select({ mediaSourceId: reviews.mediaSourceId })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.mediaType, "tv_episode"),
          like(reviews.mediaSourceId, `${seriesTmdbId}:${seasonNumber}:%`),
        ),
      );

    const reviewEpisodeNumbers = new Set(
      userReviews
        .map((r) => {
          const parts = r.mediaSourceId.split(":");
          return Number(parts[2]);
        })
        .filter(Number.isInteger),
    );

    return interactions.map((i) => ({
      episodeNumber: i.episodeNumber,
      watched: i.watched,
      liked: i.liked,
      rating: i.rating,
      hasReview: reviewEpisodeNumbers.has(i.episodeNumber),
    }));
  }

  static async getSingleInteraction(
    userId: string,
    seriesId: number,
    seasonNumber: number,
    episodeNumber: number,
  ) {
    const [row] = await db
      .select()
      .from(serialEpisodeInteractions)
      .where(
        and(
          eq(serialEpisodeInteractions.userId, userId),
          eq(serialEpisodeInteractions.seriesId, seriesId),
          eq(serialEpisodeInteractions.seasonNumber, seasonNumber),
          eq(serialEpisodeInteractions.episodeNumber, episodeNumber),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  static async upsertEpisodeInteraction(input: {
    userId: string;
    seriesId: number;
    seasonNumber: number;
    episodeNumber: number;
    watched?: boolean;
    liked?: boolean;
    rating?: number | null;
  }) {
    const [row] = await db
      .insert(serialEpisodeInteractions)
      .values({
        userId: input.userId,
        seriesId: input.seriesId,
        seasonNumber: input.seasonNumber,
        episodeNumber: input.episodeNumber,
        watched: input.watched ?? false,
        liked: input.liked ?? false,
        rating: input.rating ?? null,
      })
      .onConflictDoUpdate({
        target: [
          serialEpisodeInteractions.userId,
          serialEpisodeInteractions.seriesId,
          serialEpisodeInteractions.seasonNumber,
          serialEpisodeInteractions.episodeNumber,
        ],
        set: {
          ...(input.watched !== undefined && { watched: input.watched }),
          ...(input.liked !== undefined && { liked: input.liked }),
          ...(input.rating !== undefined && { rating: input.rating }),
          updatedAt: new Date(),
        },
      })
      .returning();

    return row ?? null;
  }

  static async getAllViewerEpisodeInteractions(
    userId: string,
    seriesId: number,
    seriesTmdbId: number,
  ) {
    const interactions = await db
      .select()
      .from(serialEpisodeInteractions)
      .where(
        and(
          eq(serialEpisodeInteractions.userId, userId),
          eq(serialEpisodeInteractions.seriesId, seriesId),
        ),
      );

    const userReviews = await db
      .select({ mediaSourceId: reviews.mediaSourceId })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.mediaType, "tv_episode"),
          like(reviews.mediaSourceId, `${seriesTmdbId}:%`),
        ),
      );

    const reviewKeys = new Set(
      userReviews.map((r) => r.mediaSourceId),
    );

    return interactions.map((i) => {
      const key = `${seriesTmdbId}:${i.seasonNumber}:${i.episodeNumber}`;
      return {
        seasonNumber: i.seasonNumber,
        episodeNumber: i.episodeNumber,
        watched: i.watched,
        liked: i.liked,
        rating: i.rating,
        hasReview: reviewKeys.has(key),
      };
    });
  }
}
