import { ReviewsService } from "../reviews/reviews.service";
import { PostsService } from "../posts/posts.service";
import { AdminAuditService, type AuditActor } from "../admin/admin-audit.service";
import { ModeratorActionService } from "../admin/services/moderator-action.service";
import { ReportTargetsRepository } from "./repositories/report-targets.repository";
import {
  ReportsRepository,
  type ReportReason,
  type ReportStatus,
  type ReportTargetType,
} from "./repositories/reports.repository";

const CONTENT_SNAPSHOT_MAX_LENGTH = 2000;
const REMOVAL_NOTICE_EXCERPT_LENGTH = 140;

const TARGET_LABEL: Record<ReportTargetType, string> = {
  review: "Review",
  post: "Post",
  comment: "Comment",
  post_comment: "Comment",
  list: "List",
};

const snapshotOf = async (targetType: ReportTargetType, targetId: string): Promise<string | null> => {
  if (targetType === "review") return (await ReviewsService.findById(targetId))?.review.content ?? null;
  if (targetType === "post") return (await PostsService.findById(targetId))?.content ?? null;
  return ReportTargetsRepository.snapshot(targetType, targetId);
};

export class ReportsService {
  static async submitReport(
    reporterId: string,
    targetType: ReportTargetType,
    targetId: string,
    reason: ReportReason,
    details?: string,
  ): Promise<{ error: string; status: 404 } | { success: true }> {
    const content = await snapshotOf(targetType, targetId);
    if (content === null) {
      return { error: `${TARGET_LABEL[targetType]} not found`, status: 404 };
    }

    await ReportsRepository.insert({
      reporterId,
      targetType,
      targetId,
      contentSnapshot: content.slice(0, CONTENT_SNAPSHOT_MAX_LENGTH),
      reason,
      details: details && details.length > 0 ? details : undefined,
    });

    return { success: true };
  }

  static async listReports(status: ReportStatus | undefined, limit: number, offset: number) {
    return ReportsRepository.list(status, limit, offset);
  }

  static async resolveReport(
    reportId: string,
    actor: AuditActor,
    status: "resolved" | "dismissed",
  ): Promise<{ error: string; status: 404 } | { success: true }> {
    const report = await ReportsRepository.findById(reportId);
    if (!report) {
      return { error: "Report not found", status: 404 };
    }

    await ReportsRepository.updateStatus(reportId, status, actor.id);
    await AdminAuditService.record(actor, {
      action: status === "resolved" ? "report.resolve" : "report.dismiss",
      targetType: "report",
      targetId: reportId,
    });
    return { success: true };
  }

  static async removeContent(
    reportId: string,
    actor: AuditActor,
    options: { reason: string | null; notifyAuthor: boolean },
  ): Promise<{ error: string; status: 404 } | { success: true }> {
    const report = await ReportsRepository.findById(reportId);
    if (!report) {
      return { error: "Report not found", status: 404 };
    }

    const notice = options.notifyAuthor
      ? { reason: options.reason, excerpt: report.contentSnapshot.slice(0, REMOVAL_NOTICE_EXCERPT_LENGTH) }
      : undefined;
    await ModeratorActionService.removeContent(
      { type: report.targetType, id: report.targetId },
      actor,
      { reason: options.reason, notice, reportId },
    );
    return { success: true };
  }

  static async listGrouped(status: ReportStatus, limit: number, offset: number) {
    return ReportsRepository.listGrouped(status, limit, offset);
  }

  static async closeTarget(input: {
    targetType: ReportTargetType;
    targetId: string;
    status: "resolved" | "dismissed";
    actor: AuditActor;
    note: string | null;
  }): Promise<number> {
    const closed = await ReportsRepository.closePendingForTarget({
      targetType: input.targetType,
      targetId: input.targetId,
      status: input.status,
      resolvedBy: input.actor.id,
      note: input.note,
    });
    if (closed > 0) {
      await AdminAuditService.record(input.actor, {
        action: input.status === "resolved" ? "report.resolve_all" : "report.dismiss_all",
        targetType: input.targetType,
        targetId: input.targetId,
        reason: input.note,
      });
    }
    return closed;
  }
}
