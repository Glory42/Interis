import { buildCommentCreatedActivityMetadata } from "../helpers/reviews-activity.helper";
import { ReviewsRepository } from "../repositories/reviews.repository";
import { ReviewsCommentsRepository } from "../repositories/reviews-comments.repository";
import { ActivityRecorder } from "../../social/services/activity-recorder.service";
import { NotificationsService } from "../../notifications/notifications.service";
import { isUuid } from "../../../commons/helpers/uuid.helper";
import { removalOwnerId, type ContentRemoval } from "../../../commons/types/content-removal.types";

export class ReviewsCommentsService {
  static async getComments(reviewId: string) {
    return ReviewsCommentsRepository.getCommentsByReviewId(reviewId);
  }

  static async addComment(userId: string, reviewId: string, content: string) {
    const review = await ReviewsRepository.getReviewWithMedia(reviewId);
    if (!review) {
      return null;
    }

    const comment = await ReviewsCommentsRepository.insertComment({ userId, reviewId, content });

    if (!comment) {
      throw new Error("Could not create comment");
    }

    const activityMediaType =
      review.mediaType === "movie" || review.mediaType === "tv"
        ? review.mediaType
        : null;

    const [, commentWithAuthor] = await Promise.all([
      ActivityRecorder.record({
        userId,
        type: "commented",
        entityId: comment.id,
        metadata: buildCommentCreatedActivityMetadata({
          reviewId,
          commentId: comment.id,
          content,
          targetUsername: review.reviewAuthorUsername,
          mediaMetadata: activityMediaType
            ? {
                mediaType: activityMediaType,
                tmdbId: review.tmdbId,
                title: review.title,
                posterPath: review.posterPath,
                releaseYear: review.releaseYear,
              }
            : null,
        }),
      }),
      ReviewsCommentsRepository.getCommentWithAuthorById(comment.id),
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

    return commentWithAuthor;
  }

  // The one way a review comment goes, whoever removes it.
  static async removeComment(commentId: string, removal: ContentRemoval) {
    if (!isUuid(commentId)) {
      return null;
    }

    const removed = await ReviewsCommentsRepository.deleteComment(commentId, removalOwnerId(removal));
    if (removed) {
      await Promise.all([
        ActivityRecorder.retract({ userId: removed.userId, type: "commented", entityId: commentId }),
        NotificationsService.notifyOfRemoval(removal, { authorId: removed.userId, id: commentId, targetType: "comment" }),
      ]);
    }
    return removed;
  }

  static async updateComment(commentId: string, userId: string, content: string) {
    const updated = await ReviewsCommentsRepository.updateCommentByIdAndUser(commentId, userId, content);
    if (!updated) {
      return null;
    }

    const [comment] = await Promise.all([
      ReviewsCommentsRepository.getCommentWithAuthorById(commentId),
      ActivityRecorder.refreshExcerpt({ userId, type: "commented", entityId: commentId, content }),
    ]);
    return comment;
  }
}
