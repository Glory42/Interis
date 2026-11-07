import { DiaryService } from "../diary/diary.service";
import { PostsService } from "../posts/posts.service";
import { ReviewsService } from "../reviews/reviews.service";
import { TvService } from "../tv/tv.service";
import type { MediaType } from "../media/constants/media-type.constant";
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

  static async listDiaryEntries(
    filters: ContentFilters & { mediaType: MediaType; seriesId?: number },
    limit: number,
    offset: number,
  ) {
    const userId = await resolveUserId(filters.username);
    return filters.mediaType === "tv"
      ? TvService.listLogsForAdmin({ userId, seriesId: filters.seriesId }, limit, offset)
      : DiaryService.listAllForAdmin({ userId, movieId: filters.movieId }, limit, offset);
  }

  // Through the Watch Log module, so Your Rating and the feed stay in step.
  static async deleteDiaryEntry(entryId: string, mediaType?: MediaType) {
    const film = mediaType === "tv" ? null : await DiaryService.deleteById(entryId);
    if (film) return { mediaType: "movie" as const };
    const series = mediaType === "movie" ? null : await TvService.deleteLogById(entryId);
    return series ? { mediaType: "tv" as const } : null;
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
