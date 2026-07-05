import { eq, and, like } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { serialSeasonInteractions } from "../serials.entity";
import { reviews } from "../../reviews/reviews.entity";

export class SerialsSeasonInteractionsRepository {
  static async getViewerSeasonInteractions(userId: string, seriesId: number, seriesTmdbId: number) {
    const interactions = await db
      .select()
      .from(serialSeasonInteractions)
      .where(
        and(
          eq(serialSeasonInteractions.userId, userId),
          eq(serialSeasonInteractions.seriesId, seriesId),
        ),
      );

    const userReviews = await db
      .select({ mediaSourceId: reviews.mediaSourceId })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, userId),
          eq(reviews.mediaType, "tv_season"),
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

  static async getSingleInteraction(userId: string, seriesId: number, seasonNumber: number) {
    const [row] = await db
      .select()
      .from(serialSeasonInteractions)
      .where(
        and(
          eq(serialSeasonInteractions.userId, userId),
          eq(serialSeasonInteractions.seriesId, seriesId),
          eq(serialSeasonInteractions.seasonNumber, seasonNumber),
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
      .insert(serialSeasonInteractions)
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
          serialSeasonInteractions.userId,
          serialSeasonInteractions.seriesId,
          serialSeasonInteractions.seasonNumber,
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
}
