import { and, desc, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { diaryEntries } from "../../diary/diary.entity";
import { profiles } from "../../users/users.entity";
import { reviews } from "../../reviews/reviews.entity";
import { ReviewsRepository } from "../../reviews/repositories/reviews.repository";

export class MoviesReviewsRepository {
  static async getReviewRowsByMovieId(movieId: number) {
    return db
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
      })
      .from(reviews)
      .innerJoin(user, eq(user.id, reviews.userId))
      .leftJoin(profiles, eq(profiles.userId, reviews.userId))
      .leftJoin(diaryEntries, eq(diaryEntries.id, reviews.diaryEntryId))
      .where(and(eq(reviews.movieId, movieId), eq(reviews.mediaType, "movie")))
      .orderBy(desc(reviews.createdAt));
  }

  static async getReviewLikeCounts(reviewIds: string[]) {
    return ReviewsRepository.getLikeCounts(reviewIds);
  }

  static async getViewerLikedReviewRows(viewerUserId: string, reviewIds: string[]) {
    return ReviewsRepository.getViewerLikedReviewIds(viewerUserId, reviewIds);
  }
}
