import { buildCommentCreatedActivityMetadata } from "../helpers/reviews-activity.helper";
import { ReviewsRepository } from "../repositories/reviews.repository";
import { SocialRepository } from "../../social/repositories/social.repository";
import { SocialFeedService } from "../../social/services/social-feed.service";
import { NotificationsService } from "../../notifications/notifications.service";
import { toReviewMediaType } from "../helpers/review-media-type.helper";

export class ReviewsCommentsService {
  static async getComments(reviewId: string) {
    return ReviewsRepository.getCommentsByReviewId(reviewId);
  }

  static async addComment(userId: string, reviewId: string, content: string) {
    const review = await ReviewsRepository.getReviewWithMedia(reviewId);
    if (!review) {
      return null;
    }

    const comment = await ReviewsRepository.insertComment({ userId, reviewId, content });

    if (!comment) {
      throw new Error("Could not create comment");
    }

    const mediaType = toReviewMediaType(review.mediaType);

    const [, commentWithAuthor] = await Promise.all([
      SocialRepository.insertActivity({
        userId,
        type: "commented",
        entityId: comment.id,
        metadata: JSON.stringify(
          buildCommentCreatedActivityMetadata({
            reviewId,
            commentId: comment.id,
            content,
            targetUsername: review.reviewAuthorUsername,
            mediaMetadata: mediaType
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
          }),
        ),
      }),
      ReviewsRepository.getCommentWithAuthorById(comment.id),
      NotificationsService.notify({
        recipientId: review.userId,
        actorId: userId,
        type: "comment_review",
        entityId: reviewId,
      }),
    ]);

    if (!commentWithAuthor) {
      throw new Error("Could not load comment author details");
    }

    SocialFeedService.invalidateFollowingFeed(userId);

    return commentWithAuthor;
  }

  static async deleteComment(commentId: string, userId: string) {
    return ReviewsRepository.deleteCommentByIdAndUser(commentId, userId);
  }

  static async updateComment(commentId: string, userId: string, content: string) {
    const updated = await ReviewsRepository.updateCommentByIdAndUser(commentId, userId, content);
    if (!updated) {
      return null;
    }

    return ReviewsRepository.getCommentWithAuthorById(commentId);
  }
}
