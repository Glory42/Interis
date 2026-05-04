import { and, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { movies } from "../../movies/movies.entity";
import { tvSeries } from "../../serials/serials.entity";
import { profiles } from "../../users/users.entity";
import { comments, reviews } from "../reviews.entity";

export class ReviewsRepository {
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
        authorImage: user.image,
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
        authorImage: user.image,
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
}
