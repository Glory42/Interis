import type { CreateReviewDto, UpdateReviewDto } from "./dto/reviews.dto";
import { ReviewsCommentsService } from "./services/reviews-comments.service";
import { ReviewsCoreService } from "./services/reviews-core.service";
import { ReviewsLikesService } from "./services/reviews-likes.service";

export class ReviewsService {
  static async create(userId: string, input: CreateReviewDto) {
    return ReviewsCoreService.create(userId, input);
  }

  static async findById(reviewId: string) {
    return ReviewsCoreService.findById(reviewId);
  }

  static async findByMovie(movieId: number) {
    return ReviewsCoreService.findByMovie(movieId);
  }

  static async findByUser(userId: string) {
    return ReviewsCoreService.findByUser(userId);
  }

  static async update(reviewId: string, userId: string, input: UpdateReviewDto) {
    return ReviewsCoreService.update(reviewId, userId, input);
  }

  static async delete(reviewId: string, userId: string) {
    return ReviewsCoreService.delete(reviewId, userId);
  }

  static async deleteById(reviewId: string) {
    return ReviewsCoreService.deleteById(reviewId);
  }

  static async listAllForAdmin(
    filters: { userId?: string; movieId?: number },
    limit: number,
    offset: number,
  ) {
    return ReviewsCoreService.listAllForAdmin(filters, limit, offset);
  }

  static async getComments(reviewId: string) {
    return ReviewsCommentsService.getComments(reviewId);
  }

  static async addComment(
    userId: string,
    reviewId: string,
    content: string,
  ) {
    return ReviewsCommentsService.addComment(userId, reviewId, content);
  }

  static async deleteComment(commentId: string, userId: string) {
    return ReviewsCommentsService.deleteComment(commentId, userId);
  }

  static async updateComment(commentId: string, userId: string, content: string) {
    return ReviewsCommentsService.updateComment(commentId, userId, content);
  }

  static async likeReview(userId: string, reviewId: string) {
    return ReviewsLikesService.likeReview(userId, reviewId);
  }

  static async unlikeReview(userId: string, reviewId: string) {
    return ReviewsLikesService.unlikeReview(userId, reviewId);
  }
}
