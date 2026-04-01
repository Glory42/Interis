import { and, eq, inArray, or, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { diaryEntries } from "../../diary/diary.entity";
import { movies } from "../../movies/movies.entity";
import { postComments, postLikes, posts } from "../../posts/posts.entity";
import { comments, reviewLikes, reviews } from "../../reviews/reviews.entity";
import { serialDiaryEntries, tvSeries } from "../../serials/serials.entity";

export class SocialFeedRepository {
  static async getReviewRowsByReviewOrDiaryIds(
    reviewIds: string[],
    diaryEntryIds: string[],
  ) {
    if (reviewIds.length === 0 && diaryEntryIds.length === 0) {
      return [];
    }

    const whereClause =
      reviewIds.length > 0 && diaryEntryIds.length > 0
        ? or(inArray(reviews.id, reviewIds), inArray(reviews.diaryEntryId, diaryEntryIds))
        : reviewIds.length > 0
          ? inArray(reviews.id, reviewIds)
          : inArray(reviews.diaryEntryId, diaryEntryIds);

    const [movieRows, tvReviewRows] = await Promise.all([
      db
        .select({
          id: reviews.id,
          diaryEntryId: reviews.diaryEntryId,
          content: reviews.content,
          containsSpoilers: reviews.containsSpoilers,
          rating: diaryEntries.rating,
          tmdbId: movies.tmdbId,
          title: movies.title,
          posterPath: movies.posterPath,
          releaseYear: movies.releaseYear,
        })
        .from(reviews)
        .innerJoin(movies, eq(reviews.movieId, movies.id))
        .leftJoin(diaryEntries, eq(reviews.diaryEntryId, diaryEntries.id))
        .where(and(eq(reviews.mediaType, "movie"), whereClause)),
      db
        .select({
          id: reviews.id,
          diaryEntryId: reviews.diaryEntryId,
          content: reviews.content,
          containsSpoilers: reviews.containsSpoilers,
          rating: serialDiaryEntries.rating,
          tmdbId: reviews.mediaSourceId,
        })
        .from(reviews)
        .leftJoin(serialDiaryEntries, eq(reviews.diaryEntryId, serialDiaryEntries.id))
        .where(and(eq(reviews.mediaType, "tv"), whereClause)),
    ]);

    const tvTmdbIds = tvReviewRows
      .map((row) => Number(row.tmdbId))
      .filter((tmdbId) => Number.isInteger(tmdbId) && tmdbId > 0);

    const tvSeriesRows = tvTmdbIds.length
      ? await db
          .select({
            tmdbId: tvSeries.tmdbId,
            title: tvSeries.title,
            posterPath: tvSeries.posterPath,
            releaseYear: tvSeries.firstAirYear,
          })
          .from(tvSeries)
          .where(inArray(tvSeries.tmdbId, [...new Set(tvTmdbIds)]))
      : [];

    const tvSeriesByTmdbId = new Map(tvSeriesRows.map((row) => [row.tmdbId, row]));

    const tvRows = tvReviewRows
      .map((row) => {
        const parsedTmdbId = Number(row.tmdbId);
        if (!Number.isInteger(parsedTmdbId) || parsedTmdbId <= 0) {
          return null;
        }

        const series = tvSeriesByTmdbId.get(parsedTmdbId);
        return {
          id: row.id,
          diaryEntryId: row.diaryEntryId,
          content: row.content,
          containsSpoilers: row.containsSpoilers,
          rating: row.rating,
          tmdbId: parsedTmdbId,
          title: series?.title ?? "Unknown series",
          posterPath: series?.posterPath ?? null,
          releaseYear: series?.releaseYear ?? null,
        };
      })
      .filter((row): row is NonNullable<typeof row> => row !== null);

    return [
      ...movieRows.map((row) => ({ ...row, mediaType: "movie" as const })),
      ...tvRows.map((row) => ({ ...row, mediaType: "tv" as const })),
    ];
  }

  static async getReviewLikeCountRows(reviewIds: string[]) {
    if (reviewIds.length === 0) {
      return [];
    }

    return db
      .select({
        reviewId: reviewLikes.reviewId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(reviewLikes)
      .where(inArray(reviewLikes.reviewId, reviewIds))
      .groupBy(reviewLikes.reviewId);
  }

  static async getReviewCommentCountRows(reviewIds: string[]) {
    if (reviewIds.length === 0) {
      return [];
    }

    return db
      .select({
        reviewId: comments.reviewId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(comments)
      .where(inArray(comments.reviewId, reviewIds))
      .groupBy(comments.reviewId);
  }

  static async getViewerReviewLikeRows(viewerId: string, reviewIds: string[]) {
    if (reviewIds.length === 0) {
      return [];
    }

    return db
      .select({ reviewId: reviewLikes.reviewId })
      .from(reviewLikes)
      .where(
        and(eq(reviewLikes.userId, viewerId), inArray(reviewLikes.reviewId, reviewIds)),
      );
  }

  static async getPostLikeCountRows(postIds: string[]) {
    if (postIds.length === 0) {
      return [];
    }

    return db
      .select({
        postId: postLikes.postId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(postLikes)
      .where(inArray(postLikes.postId, postIds))
      .groupBy(postLikes.postId);
  }

  static async getPostCommentCountRows(postIds: string[]) {
    if (postIds.length === 0) {
      return [];
    }

    return db
      .select({
        postId: postComments.postId,
        count: sql<number>`count(*)`.mapWith(Number),
      })
      .from(postComments)
      .where(inArray(postComments.postId, postIds))
      .groupBy(postComments.postId);
  }

  static async getPostById(postId: string) {
    const [post] = await db
      .select({
        id: posts.id,
        content: posts.content,
        mediaId: posts.mediaId,
        mediaType: posts.mediaType,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    return post ?? null;
  }

  static async getMovieById(movieId: number) {
    const [movie] = await db
      .select({
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
      })
      .from(movies)
      .where(eq(movies.id, movieId))
      .limit(1);

    return movie ?? null;
  }
}
