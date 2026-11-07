import { DiaryService } from "../diary/diary.service";
import { PostsService } from "../posts/posts.service";
import { ReviewsService } from "../reviews/reviews.service";
import { resolveUserId } from "./helpers/resolve-user-id.helper";
import { AdminCommentsRepository, type AdminCommentKind } from "./repositories/admin-comments.repository";

type ContentFilters = { username?: string; movieId?: number };

export class AdminContentService {
  static async listReviews(filters: ContentFilters, limit: number, offset: number) {
    const userId = await resolveUserId(filters.username);
    return ReviewsService.listAllForAdmin({ userId, movieId: filters.movieId }, limit, offset);
  }

  static async deleteReview(reviewId: string) {
    return ReviewsService.deleteById(reviewId);
  }

  static async listDiaryEntries(filters: ContentFilters, limit: number, offset: number) {
    const userId = await resolveUserId(filters.username);
    return DiaryService.listAllForAdmin({ userId, movieId: filters.movieId }, limit, offset);
  }

  static async deleteDiaryEntry(entryId: string) {
    return DiaryService.deleteById(entryId);
  }

  static async listPosts(filters: ContentFilters, limit: number, offset: number) {
    const userId = await resolveUserId(filters.username);
    return PostsService.listAllForAdmin({ userId }, limit, offset);
  }

  static async deletePost(postId: string) {
    return PostsService.deleteById(postId);
  }

  static async listComments(limit: number, offset: number) {
    return AdminCommentsRepository.listRecent(limit, offset);
  }

  static async deleteComment(kind: AdminCommentKind, commentId: string) {
    return AdminCommentsRepository.deleteById(kind, commentId);
  }
}
