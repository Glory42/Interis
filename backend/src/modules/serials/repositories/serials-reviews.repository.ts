import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { comments, reviewLikes, reviews } from "../../reviews/reviews.entity";
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
        ratingOutOfTen: serialDiaryEntries.rating,
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorImage: user.image,
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
    if (reviewIds.length === 0) {
      return [];
    }

    return db
      .select({
        reviewId: reviewLikes.reviewId,
        likeCount: sql<number>`count(*)::int`.as("likeCount"),
      })
      .from(reviewLikes)
      .where(inArray(reviewLikes.reviewId, reviewIds))
      .groupBy(reviewLikes.reviewId);
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
    if (reviewIds.length === 0) {
      return [];
    }

    return db
      .select({ reviewId: reviewLikes.reviewId })
      .from(reviewLikes)
      .where(
        and(
          eq(reviewLikes.userId, viewerUserId),
          inArray(reviewLikes.reviewId, reviewIds),
        ),
      );
  }

  static async getReviewWithSeries(reviewId: string) {
    const [reviewRow] = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        reviewAuthorUsername: user.username,
        mediaType: reviews.mediaType,
        mediaSourceId: reviews.mediaSourceId,
      })
      .from(reviews)
      .innerJoin(user, eq(user.id, reviews.userId))
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!reviewRow || reviewRow.mediaType !== "tv") {
      return null;
    }

    const tmdbId = Number(reviewRow.mediaSourceId);
    if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
      return null;
    }

    const [seriesRow] = await db
      .select({
        id: tvSeries.id,
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        posterPath: tvSeries.posterPath,
        firstAirYear: tvSeries.firstAirYear,
      })
      .from(tvSeries)
      .where(eq(tvSeries.tmdbId, tmdbId))
      .limit(1);

    if (!seriesRow) {
      return null;
    }

    return {
      id: reviewRow.id,
      userId: reviewRow.userId,
      reviewAuthorUsername: reviewRow.reviewAuthorUsername,
      seriesId: seriesRow.id,
      tmdbId: seriesRow.tmdbId,
      title: seriesRow.title,
      posterPath: seriesRow.posterPath,
      firstAirYear: seriesRow.firstAirYear,
    };
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

  static async getReviewCommentsByReviewId(reviewId: string) {
    return db
      .select({
        id: comments.id,
        userId: comments.userId,
        reviewId: comments.reviewId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorAvatarUrl: profiles.avatarUrl,
        authorImage: user.image,
      })
      .from(comments)
      .innerJoin(user, eq(comments.userId, user.id))
      .leftJoin(profiles, eq(comments.userId, profiles.userId))
      .where(eq(comments.reviewId, reviewId))
      .orderBy(comments.createdAt);
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

  static async getReviewCommentWithAuthorById(commentId: string) {
    const [row] = await db
      .select({
        id: comments.id,
        userId: comments.userId,
        reviewId: comments.reviewId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorAvatarUrl: profiles.avatarUrl,
        authorImage: user.image,
      })
      .from(comments)
      .innerJoin(user, eq(comments.userId, user.id))
      .leftJoin(profiles, eq(comments.userId, profiles.userId))
      .where(eq(comments.id, commentId))
      .limit(1);

    return row ?? null;
  }

  static async getReviewMetadataForActivity(reviewId: string) {
    const [reviewRow] = await db
      .select({
        reviewId: reviews.id,
        reviewAuthorUsername: user.username,
        mediaType: reviews.mediaType,
        mediaSourceId: reviews.mediaSourceId,
      })
      .from(reviews)
      .innerJoin(user, eq(user.id, reviews.userId))
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!reviewRow || reviewRow.mediaType !== "tv") {
      return null;
    }

    const tmdbId = Number(reviewRow.mediaSourceId);
    if (!Number.isInteger(tmdbId) || tmdbId <= 0) {
      return null;
    }

    const [seriesRow] = await db
      .select({
        seriesId: tvSeries.id,
        tmdbId: tvSeries.tmdbId,
        title: tvSeries.title,
        posterPath: tvSeries.posterPath,
        firstAirYear: tvSeries.firstAirYear,
      })
      .from(tvSeries)
      .where(eq(tvSeries.tmdbId, tmdbId))
      .limit(1);

    if (!seriesRow) {
      return null;
    }

    return {
      reviewId: reviewRow.reviewId,
      reviewAuthorUsername: reviewRow.reviewAuthorUsername,
      seriesId: seriesRow.seriesId,
      tmdbId: seriesRow.tmdbId,
      title: seriesRow.title,
      posterPath: seriesRow.posterPath,
      firstAirYear: seriesRow.firstAirYear,
    };
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
    diaryEntryId: string;
    content: string;
    containsSpoilers: boolean;
  }) {
    const [review] = await db
      .insert(reviews)
      .values({
        userId: input.userId,
        mediaType: "tv",
        mediaSource: "tmdb",
        mediaSourceId: String(input.seriesTmdbId),
        diaryEntryId: input.diaryEntryId,
        content: input.content,
        containsSpoilers: input.containsSpoilers,
      })
      .onConflictDoUpdate({
        target: [
          reviews.userId,
          reviews.mediaType,
          reviews.mediaSource,
          reviews.mediaSourceId,
        ],
        set: {
          diaryEntryId: input.diaryEntryId,
          content: input.content,
          containsSpoilers: input.containsSpoilers,
          updatedAt: new Date(),
        },
      })
      .returning({
        id: reviews.id,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
      });

    return review ?? null;
  }
}
