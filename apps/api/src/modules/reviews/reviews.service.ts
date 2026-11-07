import type { ContentRemoval } from "../../commons/types/content-removal.types";
import type { CreateReviewDto, MyTitleReviewsQueryDto, UpdateReviewDto } from "./dto/reviews.dto";
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

  static async findMineForTitle(userId: string, query: MyTitleReviewsQueryDto) {
    return ReviewsCoreService.findMineForTitle(userId, query);
  }

  static async findByUser(userId: string) {
    return ReviewsCoreService.findByUser(userId);
  }

  static async update(reviewId: string, userId: string, input: UpdateReviewDto) {
    return ReviewsCoreService.update(reviewId, userId, input);
  }

  static async remove(reviewId: string, removal: ContentRemoval) {
    return ReviewsCoreService.remove(reviewId, removal);
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

  static async removeComment(commentId: string, removal: ContentRemoval) {
    return ReviewsCommentsService.removeComment(commentId, removal);
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
