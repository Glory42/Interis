import { and, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { activities } from "../../social/social.entity";
import { buildReviewLikedActivityMetadata } from "../helpers/reviews-activity.helper";
import { ReviewsRepository } from "../repositories/reviews.repository";
import { reviewLikes } from "../reviews.entity";
import { NotificationsService } from "../../notifications/notifications.service";

export class ReviewsLikesService {
  static async likeReview(userId: string, reviewId: string) {
    const [existing] = await db
      .select()
      .from(reviewLikes)
      .where(
        and(eq(reviewLikes.userId, userId), eq(reviewLikes.reviewId, reviewId)),
      )
      .limit(1);

    if (existing) {
      return { liked: true, alreadyLiked: true };
    }

    await db.insert(reviewLikes).values({ userId, reviewId });

    const review = await ReviewsRepository.getReviewWithMedia(reviewId);
    const activityMediaType =
      review?.mediaType === "movie" || review?.mediaType === "tv"
        ? review.mediaType
        : null;

    await Promise.all([
      db.insert(activities).values({
        userId,
        type: "liked_review",
        entityId: reviewId,
        metadata: JSON.stringify(
          buildReviewLikedActivityMetadata({
            reviewId,
            mediaMetadata: review && activityMediaType
              ? {
                  mediaType: activityMediaType,
                  tmdbId: review.tmdbId,
                  title: review.title,
                  posterPath: review.posterPath,
                  releaseYear: review.releaseYear,
                }
              : null,
            targetUsername: review?.reviewAuthorUsername ?? null,
          }),
        ),
      }),
      review
        ? NotificationsService.notify({
            recipientId: review.userId,
            actorId: userId,
            type: "like_review",
            entityId: reviewId,
          })
        : Promise.resolve(),
    ]);

    return { liked: true, alreadyLiked: false };
  }

  static async unlikeReview(userId: string, reviewId: string) {
    const [deleted] = await db
      .delete(reviewLikes)
      .where(
        and(eq(reviewLikes.userId, userId), eq(reviewLikes.reviewId, reviewId)),
      )
      .returning({ reviewId: reviewLikes.reviewId });

    return deleted ?? null;
  }
}
