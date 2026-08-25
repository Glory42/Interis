import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { comments, reviewLikes, reviews } from "../../reviews/reviews.entity";
import { ReviewsRepository } from "../../reviews/repositories/reviews.repository";
import { profiles } from "../../users/users.entity";
import { serialDiaryEntries, tvSeries } from "../serials.entity";

export class SerialsReviewsRepository {
  static async getLogsCountBySeriesId(seriesId: number): Promise<number> {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int`.as("count") })
      .from(serialDiaryEntries)
      .where(eq(serialDiaryEntries.seriesId, seriesId))
      .limit(1);

    return row?.count ?? 0;
  }

  static async getReviewRowsBySeriesId(seriesId: number) {
    const [series] = await db
      .select({ tmdbId: tvSeries.tmdbId })
      .from(tvSeries)
      .where(eq(tvSeries.id, seriesId))
      .limit(1);

    if (!series) {
      return [];
    }

    return db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        watchedDate: serialDiaryEntries.watchedDate,
        rating: serialDiaryEntries.rating,
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorAvatarUrl: profiles.avatarUrl,
      })
      .from(reviews)
      .innerJoin(user, eq(user.id, reviews.userId))
      .leftJoin(profiles, eq(profiles.userId, reviews.userId))
      .leftJoin(serialDiaryEntries, eq(serialDiaryEntries.id, reviews.diaryEntryId))
      .where(
        and(
          eq(reviews.mediaType, "tv"),
          eq(reviews.mediaSource, "tmdb"),
          eq(reviews.mediaSourceId, String(series.tmdbId)),
        ),
      )
      .orderBy(desc(reviews.createdAt));
  }

  static async getReviewLikeCounts(reviewIds: string[]) {
    return ReviewsRepository.getLikeCounts(reviewIds);
  }

  static async getReviewCommentCounts(reviewIds: string[]) {
    if (reviewIds.length === 0) {
      return [];
    }

    return db
      .select({
        reviewId: comments.reviewId,
        commentCount: sql<number>`count(*)::int`.as("commentCount"),
      })
      .from(comments)
      .where(inArray(comments.reviewId, reviewIds))
      .groupBy(comments.reviewId);
  }

  static async getViewerLikedReviewRows(viewerUserId: string, reviewIds: string[]) {
    return ReviewsRepository.getViewerLikedReviewIds(viewerUserId, reviewIds);
  }

  static async insertReviewLike(userId: string, reviewId: string) {
    const [row] = await db
      .insert(reviewLikes)
      .values({ userId, reviewId })
      .onConflictDoNothing()
      .returning({ reviewId: reviewLikes.reviewId });

    return row ?? null;
  }

  static async deleteReviewLikeByUser(userId: string, reviewId: string) {
    const [row] = await db
      .delete(reviewLikes)
      .where(and(eq(reviewLikes.userId, userId), eq(reviewLikes.reviewId, reviewId)))
      .returning({ reviewId: reviewLikes.reviewId });

    return row ?? null;
  }

  static async insertReviewComment(input: {
    userId: string;
    reviewId: string;
    content: string;
  }) {
    const [comment] = await db
      .insert(comments)
      .values({
        userId: input.userId,
        reviewId: input.reviewId,
        content: input.content,
      })
      .returning();

    return comment ?? null;
  }

  static async getViewerReviewRows(viewerUserId: string, seriesId: number) {
    const [series] = await db
      .select({ tmdbId: tvSeries.tmdbId })
      .from(tvSeries)
      .where(eq(tvSeries.id, seriesId))
      .limit(1);

    if (!series) {
      return [];
    }

    return db
      .select({
        id: reviews.id,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
      })
      .from(reviews)
      .where(
        and(
          eq(reviews.userId, viewerUserId),
          eq(reviews.mediaType, "tv"),
          eq(reviews.mediaSource, "tmdb"),
          eq(reviews.mediaSourceId, String(series.tmdbId)),
        ),
      )
      .limit(1);
  }

  static async upsertReview(input: {
    userId: string;
    seriesTmdbId: number;
    diaryEntryId: string | null;
    content: string;
    containsSpoilers: boolean;
  }) {
    return ReviewsRepository.upsertReview({
      userId: input.userId,
      mediaType: "tv",
      mediaSource: "tmdb",
      mediaSourceId: String(input.seriesTmdbId),
      movieId: null,
      diaryEntryId: input.diaryEntryId,
      content: input.content,
      containsSpoilers: input.containsSpoilers,
    });
  }
}
