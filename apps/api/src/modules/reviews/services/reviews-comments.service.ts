import { db } from "../../../infrastructure/database/db";
import { activities } from "../../social/social.entity";
import { comments } from "../reviews.entity";
import { buildCommentCreatedActivityMetadata } from "../helpers/reviews-activity.helper";
import { ReviewsRepository } from "../repositories/reviews.repository";
import { NotificationsService } from "../../notifications/notifications.service";

export class ReviewsCommentsService {
  static async getComments(reviewId: string) {
    return ReviewsRepository.getCommentsByReviewId(reviewId);
  }

  static async addComment(userId: string, reviewId: string, content: string) {
    const review = await ReviewsRepository.getReviewWithMedia(reviewId);
    if (!review) {
      return null;
    }

    const [comment] = await db
      .insert(comments)
      .values({ userId, reviewId, content })
      .returning();

    if (!comment) {
      throw new Error("Could not create comment");
    }

    const activityMediaType =
      review.mediaType === "movie" || review.mediaType === "tv"
        ? review.mediaType
        : null;

    const [, commentWithAuthor] = await Promise.all([
      db.insert(activities).values({
        userId,
        type: "commented",
        entityId: comment.id,
        metadata: JSON.stringify(
          buildCommentCreatedActivityMetadata({
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
