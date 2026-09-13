import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { diaryEntries } from "../../diary/diary.entity";
import { profiles } from "../../users/users.entity";
import { reviewLikes, reviews } from "../../reviews/reviews.entity";
import { ReviewsRepository } from "../../reviews/repositories/reviews.repository";
import type { MovieDetailReviewSort } from "../dto/movies.dto";

export class MoviesReviewsRepository {
  // Sorted/paginated in SQL, not JS, so a movie with thousands of reviews
  // never ships its full history per request; totalCount rides a window fn.
  static async getReviewRowsByMovieId(
    movieId: number,
    options: { sort: MovieDetailReviewSort; limit: number; offset: number },
  ) {
    const likeCountExpr = sql<number>`(
      select count(*) from ${reviewLikes} where ${reviewLikes.reviewId} = ${reviews.id}
    )`;

    const orderBy =
      options.sort === "popular"
        ? [desc(likeCountExpr), desc(reviews.createdAt)]
        : [desc(reviews.createdAt)];

    const rawRows = await db
      .select({
        id: reviews.id,
        userId: reviews.userId,
        content: reviews.content,
        containsSpoilers: reviews.containsSpoilers,
        createdAt: reviews.createdAt,
        updatedAt: reviews.updatedAt,
        watchedDate: diaryEntries.watchedDate,
        rating: diaryEntries.rating,
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorAvatarUrl: profiles.avatarUrl,
        totalCount: sql<number>`count(*) over()::int`,
      })
      .from(reviews)
      .innerJoin(user, eq(user.id, reviews.userId))
      .leftJoin(profiles, eq(profiles.userId, reviews.userId))
      .leftJoin(diaryEntries, eq(diaryEntries.id, reviews.diaryEntryId))
      .where(and(eq(reviews.movieId, movieId), eq(reviews.mediaType, "movie")))
      .orderBy(...orderBy)
      .limit(options.limit)
      .offset(options.offset);

    const totalCount = rawRows[0]?.totalCount ?? 0;
    const rows = rawRows.map(({ totalCount: _totalCount, ...row }) => row);

    return { rows, totalCount };
  }

  static async getReviewLikeCounts(reviewIds: string[]) {
    return ReviewsRepository.getLikeCounts(reviewIds);
  }

  static async getViewerLikedReviewRows(viewerUserId: string, reviewIds: string[]) {
    return ReviewsRepository.getViewerLikedReviewIds(viewerUserId, reviewIds);
  }
}
