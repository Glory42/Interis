import { buildReviewLikedActivityMetadata } from "../helpers/reviews-activity.helper";
import { ReviewsRepository } from "../repositories/reviews.repository";
import { SocialRepository } from "../../social/repositories/social.repository";
import { SocialFeedService } from "../../social/services/social-feed.service";
import { NotificationsService } from "../../notifications/notifications.service";
import { toReviewMediaType } from "../helpers/review-media-type.helper";

export class ReviewsLikesService {
  static async likeReview(userId: string, reviewId: string) {
    const existing = await ReviewsRepository.getExistingLike(userId, reviewId);

    if (existing) {
      return { liked: true, alreadyLiked: true };
    }

    await ReviewsRepository.insertLike(userId, reviewId);

    const review = await ReviewsRepository.getReviewWithMedia(reviewId);
    const mediaType = review ? toReviewMediaType(review.mediaType) : null;

    await Promise.all([
      SocialRepository.insertActivity({
        userId,
        type: "liked_review",
        entityId: reviewId,
        metadata: JSON.stringify(
          buildReviewLikedActivityMetadata({
            reviewId,
            mediaMetadata: review && mediaType
              ? {
                  mediaType,
                  tmdbId: review.tmdbId,
                  mbid: review.mbid,
                  volumeId: review.volumeId,
                  title: review.title,
                  posterPath: review.posterPath,
                  coverArtUrl: review.coverArtUrl,
                  artistName: review.artistName,
                  authors: review.authors,
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

    SocialFeedService.invalidateFollowingFeed(userId);

    return { liked: true, alreadyLiked: false };
  }

  static async unlikeReview(userId: string, reviewId: string) {
    const result = await ReviewsRepository.deleteLike(userId, reviewId);
    SocialFeedService.invalidateFollowingFeed(userId);
    return result;
  }
}
