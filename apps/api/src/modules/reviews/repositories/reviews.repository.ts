import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { movies } from "../../movies/movies.entity";
import { tvSeries } from "../../serials/serials.entity";
import { profiles } from "../../users/users.entity";
import { comments, reviewLikes, reviews } from "../reviews.entity";
import type { UpdateReviewDto } from "../dto/reviews.dto";

export class ReviewsRepository {
  static async getLikeCounts(reviewIds: string[]) {
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

  static async getViewerLikedReviewIds(viewerUserId: string, reviewIds: string[]) {
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

  static async getExistingLike(userId: string, reviewId: string) {
    const [existing] = await db
      .select()
      .from(reviewLikes)
      .where(and(eq(reviewLikes.userId, userId), eq(reviewLikes.reviewId, reviewId)))
      .limit(1);

    return existing ?? null;
  }

  static async insertLike(userId: string, reviewId: string) {
    await db.insert(reviewLikes).values({ userId, reviewId });
  }

  static async deleteLike(userId: string, reviewId: string) {
    const [deleted] = await db
      .delete(reviewLikes)
      .where(and(eq(reviewLikes.userId, userId), eq(reviewLikes.reviewId, reviewId)))
      .returning({ reviewId: reviewLikes.reviewId });

    return deleted ?? null;
  }

  static async insertMovieReview(input: {
    userId: string;
    movieId: number;
    movieTmdbId: number;
    diaryEntryId: string | null;
    content: string;
    containsSpoilers: boolean;
  }) {
    const [review] = await db
      .insert(reviews)
      .values({
        userId: input.userId,
        mediaType: "movie",
        mediaSource: "tmdb",
        mediaSourceId: String(input.movieTmdbId),
        movieId: input.movieId,
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
          movieId: input.movieId,
          diaryEntryId: input.diaryEntryId,
          content: input.content,
          containsSpoilers: input.containsSpoilers,
          updatedAt: new Date(),
        },
      })
      .returning();

    return review ?? null;
  }

  static async findByIdWithLikeCount(reviewId: string) {
    const [review] = await db
      .select({
        review: reviews,
        likeCount: sql<number>`count(${reviewLikes.reviewId})`.as("like_count"),
      })
      .from(reviews)
      .leftJoin(reviewLikes, eq(reviewLikes.reviewId, reviews.id))
      .where(eq(reviews.id, reviewId))
      .groupBy(reviews.id)
      .limit(1);

    return review ?? null;
  }

  static async findByMovieId(movieId: number) {
    return db
      .select()
      .from(reviews)
      .where(and(eq(reviews.movieId, movieId), eq(reviews.mediaType, "movie")))
      .orderBy(desc(reviews.createdAt));
  }

  static async findByUserId(userId: string) {
    return db
      .select()
      .from(reviews)
      .where(eq(reviews.userId, userId))
      .orderBy(desc(reviews.createdAt));
  }

  static async updateByIdAndUser(reviewId: string, userId: string, input: UpdateReviewDto) {
    const [updated] = await db
      .update(reviews)
      .set({
        ...(input.content !== undefined && { content: input.content }),
        ...(input.containsSpoilers !== undefined && {
          containsSpoilers: input.containsSpoilers,
        }),
      })
      .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
      .returning();

    return updated ?? null;
  }

  static async deleteByIdAndUser(reviewId: string, userId: string) {
    const [deleted] = await db
      .delete(reviews)
      .where(and(eq(reviews.id, reviewId), eq(reviews.userId, userId)))
      .returning({ id: reviews.id });

    return deleted ?? null;
  }

  // No ownership check — admin moderation only.
  static async deleteById(reviewId: string) {
    const [deleted] = await db
      .delete(reviews)
      .where(eq(reviews.id, reviewId))
      .returning({ id: reviews.id });

    return deleted ?? null;
  }

  // Movie reviews only — TV reviews live in the serials module's own table.
  static async listAllForAdmin(
    filters: { userId?: string; movieId?: number },
    limit: number,
    offset: number,
  ) {
    const conditions = [];
    if (filters.userId) conditions.push(eq(reviews.userId, filters.userId));
    if (filters.movieId) conditions.push(eq(reviews.movieId, filters.movieId));

    return db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        authorUsername: user.username,
        mediaType: reviews.mediaType,
        movieId: reviews.movieId,
        movieTitle: movies.title,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        createdAt: reviews.createdAt,
      })
      .from(reviews)
      .innerJoin(user, eq(user.id, reviews.userId))
      .leftJoin(movies, eq(movies.id, reviews.movieId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reviews.createdAt))
      .limit(limit)
      .offset(offset);
  }

  static async insertComment(input: { userId: string; reviewId: string; content: string }) {
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

  static async getReviewWithMedia(reviewId: string) {
    const [reviewRow] = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        reviewAuthorUsername: user.username,
        mediaType: reviews.mediaType,
        mediaSource: reviews.mediaSource,
        mediaSourceId: reviews.mediaSourceId,
        movieId: reviews.movieId,
      })
      .from(reviews)
      .innerJoin(user, eq(user.id, reviews.userId))
      .where(eq(reviews.id, reviewId))
      .limit(1);

    if (!reviewRow) {
      return null;
    }

    if (reviewRow.mediaType === "movie" && reviewRow.movieId !== null) {
      const [movieRow] = await db
        .select({
          tmdbId: movies.tmdbId,
          title: movies.title,
          posterPath: movies.posterPath,
          releaseYear: movies.releaseYear,
        })
        .from(movies)
        .where(eq(movies.id, reviewRow.movieId))
        .limit(1);

      return {
        ...reviewRow,
        tmdbId: movieRow?.tmdbId ?? Number(reviewRow.mediaSourceId),
        title: movieRow?.title ?? null,
        posterPath: movieRow?.posterPath ?? null,
        releaseYear: movieRow?.releaseYear ?? null,
      };
    }

    if (reviewRow.mediaType === "tv") {
      const tmdbId = Number(reviewRow.mediaSourceId);
      const [seriesRow] = Number.isNaN(tmdbId)
        ? [null]
        : await db
            .select({
              tmdbId: tvSeries.tmdbId,
              title: tvSeries.title,
              posterPath: tvSeries.posterPath,
              releaseYear: tvSeries.firstAirYear,
            })
            .from(tvSeries)
            .where(eq(tvSeries.tmdbId, tmdbId))
            .limit(1);

      return {
        ...reviewRow,
        tmdbId: seriesRow?.tmdbId ?? (Number.isNaN(tmdbId) ? null : tmdbId),
        title: seriesRow?.title ?? null,
        posterPath: seriesRow?.posterPath ?? null,
        releaseYear: seriesRow?.releaseYear ?? null,
      };
    }

    return {
      ...reviewRow,
      tmdbId: null,
      title: null,
      posterPath: null,
      releaseYear: null,
    };
  }

  static async getCommentsByReviewId(reviewId: string) {
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
      })
      .from(comments)
      .innerJoin(user, eq(comments.userId, user.id))
      .leftJoin(profiles, eq(comments.userId, profiles.userId))
      .where(eq(comments.reviewId, reviewId))
      .orderBy(comments.createdAt);
  }

  static async getCommentWithAuthorById(commentId: string) {
    const [commentWithAuthor] = await db
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
      })
      .from(comments)
      .innerJoin(user, eq(comments.userId, user.id))
      .leftJoin(profiles, eq(comments.userId, profiles.userId))
      .where(eq(comments.id, commentId))
      .limit(1);

    return commentWithAuthor ?? null;
  }

  static async deleteCommentByIdAndUser(commentId: string, userId: string) {
    const [deleted] = await db
      .delete(comments)
      .where(and(eq(comments.id, commentId), eq(comments.userId, userId)))
      .returning({ id: comments.id });

    return deleted ?? null;
  }

  static async updateCommentByIdAndUser(commentId: string, userId: string, content: string) {
    const [updated] = await db
      .update(comments)
      .set({ content, updatedAt: new Date() })
      .where(and(eq(comments.id, commentId), eq(comments.userId, userId)))
      .returning({ id: comments.id });

    return updated ?? null;
  }
}
