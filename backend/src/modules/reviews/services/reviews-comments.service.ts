import { db } from "../../../infrastructure/database/db";
import { activities } from "../../social/social.entity";
import { comments } from "../reviews.entity";
import { buildCommentCreatedActivityMetadata } from "../helpers/reviews-activity.helper";
import { ReviewsRepository } from "../repositories/reviews.repository";

export class ReviewsCommentsService {
  static async getComments(reviewId: string, _viewerUserId?: string | null) {
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

    await db.insert(activities).values({
      userId,
      type: "commented",
      entityId: comment.id,
      metadata: JSON.stringify(
        buildCommentCreatedActivityMetadata({
          reviewId,
          commentId: comment.id,
          content,
          targetUsername: review.reviewAuthorUsername,
          mediaMetadata: {
            mediaType:
              review.mediaType === "tv"
                ? "tv"
                : review.mediaType === "book"
                  ? "book"
                  : review.mediaType === "music"
                    ? "music"
                    : "movie",
            tmdbId: review.tmdbId,
            title: review.title,
            posterPath: review.posterPath,
            releaseYear: review.releaseYear,
          },
        }),
      ),
    });

    const commentWithAuthor = await ReviewsRepository.getCommentWithAuthorById(comment.id);

    if (!commentWithAuthor) {
      throw new Error("Could not load comment author details");
    }

    return commentWithAuthor;
  }

  static async deleteComment(commentId: string, userId: string) {
    return ReviewsRepository.deleteCommentByIdAndUser(commentId, userId);
  }
}
