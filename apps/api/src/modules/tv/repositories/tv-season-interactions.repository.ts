import { eq, and, like } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { seriesSeasonInteractions } from "../tv.entity";
import { reviews } from "../../reviews/reviews.entity";
import { TV_SEASON_REVIEW_TYPE } from "../../reviews/constants/review-media-type.constant";

export class TvSeasonInteractionsRepository {
  static async getViewerSeasonInteractions(userId: string, seriesId: number, seriesTmdbId: number) {
    const interactions = await db
      .select()
      .from(seriesSeasonInteractions)
      .where(
        and(
          eq(seriesSeasonInteractions.userId, userId),
          eq(seriesSeasonInteractions.seriesId, seriesId),
        ),
      );

    const userReviews = await db
      .select({ mediaSourceId: reviews.mediaSourceId })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.mediaType, TV_SEASON_REVIEW_TYPE),
          like(reviews.mediaSourceId, `${seriesTmdbId}:%`),
        ),
      );

    const reviewSeasonNumbers = new Set(
      userReviews
        .map((r) => {
          const parts = r.mediaSourceId.split(":");
          return Number(parts[1]);
        })
        .filter(Number.isInteger),
    );

    return interactions.map((i) => ({
      seasonNumber: i.seasonNumber,
      watched: i.watched,
      liked: i.liked,
      rating: i.rating,
      hasReview: reviewSeasonNumbers.has(i.seasonNumber),
    }));
  }

  // Clears every season row for the series, specials included, in one query
  // instead of one TMDB-backed upsert per season.
  static async unwatchAllForSeries(userId: string, seriesId: number) {
    await db
      .update(seriesSeasonInteractions)
      .set({ watched: false, updatedAt: new Date() })
      .where(
        and(
          eq(seriesSeasonInteractions.userId, userId),
          eq(seriesSeasonInteractions.seriesId, seriesId),
          eq(seriesSeasonInteractions.watched, true),
        ),
      );
  }

  static async getSingleInteraction(userId: string, seriesId: number, seasonNumber: number) {
    const [row] = await db
      .select()
      .from(seriesSeasonInteractions)
      .where(
        and(
          eq(seriesSeasonInteractions.userId, userId),
          eq(seriesSeasonInteractions.seriesId, seriesId),
          eq(seriesSeasonInteractions.seasonNumber, seasonNumber),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  static async upsertSeasonInteraction(input: {
    userId: string;
    seriesId: number;
    seasonNumber: number;
    watched?: boolean;
    liked?: boolean;
    rating?: number | null;
  }) {
    const [row] = await db
      .insert(seriesSeasonInteractions)
      .values({
        userId: input.userId,
        seriesId: input.seriesId,
        seasonNumber: input.seasonNumber,
        watched: input.watched ?? false,
        liked: input.liked ?? false,
        rating: input.rating ?? null,
      })
      .onConflictDoUpdate({
        target: [
          seriesSeasonInteractions.userId,
          seriesSeasonInteractions.seriesId,
          seriesSeasonInteractions.seasonNumber,
        ],
        set: {
          // Liking / rating a season doesn't mark it watched: that would
          // cascade to every episode in it (#66). Only an explicit `watched` does.
          ...(input.watched !== undefined && { watched: input.watched }),
          ...(input.liked !== undefined && { liked: input.liked }),
          ...(input.rating !== undefined && { rating: input.rating }),
          updatedAt: new Date(),
        },
      })
      .returning();

    return row ?? null;
  }
}
