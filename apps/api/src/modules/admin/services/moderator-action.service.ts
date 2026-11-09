import { ListsService } from "../../lists/lists.service";
import { PostsService } from "../../posts/posts.service";
import { ReviewsService } from "../../reviews/reviews.service";
import { ReportsRepository } from "../../reports/repositories/reports.repository";
import type { ContentRemoval, RemovableContentType } from "../../../commons/types/content-removal.types";
import { AdminAuditService, type AuditActor } from "../admin-audit.service";

export type ModeratedContent = { type: RemovableContentType; id: string };

export type RemoveContentOptions = {
  reason?: string | null;
  notice?: { reason: string | null; excerpt: string };
  // Set when acting from the report queue; the audit entry then names the Report.
  reportId?: string;
};

// Each content module's own remove op retracts the activity and sends the notice.
const removeTarget = (target: ModeratedContent, removal: ContentRemoval) => {
  if (target.type === "review") return ReviewsService.remove(target.id, removal);
  if (target.type === "post") return PostsService.remove(target.id, removal);
  if (target.type === "comment") return ReviewsService.removeComment(target.id, removal);
  if (target.type === "post_comment") return PostsService.removeComment(target.id, removal);
  return ListsService.remove(target.id, removal);
};

export class ModeratorActionService {
  // Removes the content, closes every pending Report on it and writes the audit entry.
  // Returns false, doing nothing, when the content is gone and no Report is being acted on.
  static async removeContent(
    target: ModeratedContent,
    actor: AuditActor,
    options: RemoveContentOptions = {},
  ): Promise<boolean> {
    const removed = await removeTarget(target, { by: "moderator", notice: options.notice });
    if (removed === null && !options.reportId) return false;

    await ReportsRepository.resolvePendingForTarget(target.type, target.id, actor.id);
    await AdminAuditService.record(
      actor,
      options.reportId
        ? { action: "report.remove_content", targetType: "report", targetId: options.reportId, reason: options.reason }
        : {
          action: `${target.type === "post_comment" ? "comment" : target.type}.delete`,
          targetType: target.type,
          targetId: target.id,
          reason: options.reason,
        },
    );
    return true;
  }
}
