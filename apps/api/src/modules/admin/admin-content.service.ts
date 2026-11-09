import { DiaryService } from "../diary/diary.service";
import { PostsService } from "../posts/posts.service";
import { ReviewsService } from "../reviews/reviews.service";
import { TvService } from "../tv/tv.service";
import type { MediaType } from "../media/constants/media-type.constant";
import { AdminAuditService, type AuditActor } from "./admin-audit.service";
import { ModeratorActionService } from "./services/moderator-action.service";
import { resolveUserId } from "./helpers/resolve-user-id.helper";
import { AdminCommentsRepository, type AdminCommentKind } from "./repositories/admin-comments.repository";

type ContentFilters = { username?: string; movieId?: number };

export class AdminContentService {
  static async listReviews(filters: ContentFilters, limit: number, offset: number) {
    const userId = await resolveUserId(filters.username);
    return ReviewsService.listAllForAdmin({ userId, movieId: filters.movieId }, limit, offset);
  }

  static async deleteReview(reviewId: string, actor: AuditActor) {
    return ModeratorActionService.removeContent({ type: "review", id: reviewId }, actor);
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
  static async deleteDiaryEntry(entryId: string, actor: AuditActor, mediaType?: MediaType): Promise<boolean> {
    const film = mediaType === "tv" ? null : await DiaryService.deleteById(entryId);
    const series = film || mediaType === "movie" ? null : await TvService.deleteLogById(entryId);
    if (!film && !series) return false;
    await AdminAuditService.record(actor, {
      action: "diary_entry.delete",
      targetType: film ? "diary_entry" : "serial_diary_entry",
      targetId: entryId,
    });
    return true;
  }

  static async listPosts(filters: ContentFilters, limit: number, offset: number) {
    const userId = await resolveUserId(filters.username);
    return PostsService.listAllForAdmin({ userId }, limit, offset);
  }

  static async deletePost(postId: string, actor: AuditActor) {
    return ModeratorActionService.removeContent({ type: "post", id: postId }, actor);
  }

  static async listComments(limit: number, offset: number) {
    return AdminCommentsRepository.listRecent(limit, offset);
  }

  static async deleteComment(kind: AdminCommentKind, commentId: string, actor: AuditActor) {
    const type = kind === "review" ? "comment" : "post_comment";
    return ModeratorActionService.removeContent({ type, id: commentId }, actor);
  }
}
