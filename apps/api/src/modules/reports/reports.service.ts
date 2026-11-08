import { ReviewsService } from "../reviews/reviews.service";
import { PostsService } from "../posts/posts.service";
import { ListsService } from "../lists/lists.service";
import type { ContentRemoval } from "../../commons/types/content-removal.types";
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

// Each content module's own remove op retracts the activity and sends the notice.
const removeTarget = async (targetType: ReportTargetType, targetId: string, removal: ContentRemoval) => {
  if (targetType === "review") return ReviewsService.remove(targetId, removal);
  if (targetType === "post") return PostsService.remove(targetId, removal);
  if (targetType === "comment") return ReviewsService.removeComment(targetId, removal);
  if (targetType === "post_comment") return PostsService.removeComment(targetId, removal);
  return ListsService.remove(targetId, removal);
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
    adminUserId: string,
    status: "resolved" | "dismissed",
  ): Promise<{ error: string; status: 404 } | { success: true }> {
    const report = await ReportsRepository.findById(reportId);
    if (!report) {
      return { error: "Report not found", status: 404 };
    }

    await ReportsRepository.updateStatus(reportId, status, adminUserId);
    return { success: true };
  }

  static async removeContent(
    reportId: string,
    adminUserId: string,
    options: { reason: string | null; notifyAuthor: boolean },
  ): Promise<{ error: string; status: 404 } | { success: true }> {
    const report = await ReportsRepository.findById(reportId);
    if (!report) {
      return { error: "Report not found", status: 404 };
    }

    const notice = options.notifyAuthor
      ? { reason: options.reason, excerpt: report.contentSnapshot.slice(0, REMOVAL_NOTICE_EXCERPT_LENGTH) }
      : undefined;
    await removeTarget(report.targetType, report.targetId, { by: "moderator", notice });

    await ReportsRepository.resolvePendingForTarget(report.targetType, report.targetId, adminUserId);
    return { success: true };
  }

  static async listGrouped(status: ReportStatus, limit: number, offset: number) {
    return ReportsRepository.listGrouped(status, limit, offset);
  }

  static async closeTarget(input: {
    targetType: ReportTargetType;
    targetId: string;
    status: "resolved" | "dismissed";
    adminUserId: string;
    note: string | null;
  }): Promise<number> {
    return ReportsRepository.closePendingForTarget({
      targetType: input.targetType,
      targetId: input.targetId,
      status: input.status,
      resolvedBy: input.adminUserId,
      note: input.note,
    });
  }
}
