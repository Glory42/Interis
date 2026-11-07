import { ReviewsService } from "../reviews/reviews.service";
import { PostsService } from "../posts/posts.service";
import { ReportTargetsRepository } from "./repositories/report-targets.repository";
import {
  ReportsRepository,
  type ReportReason,
  type ReportStatus,
  type ReportTargetType,
} from "./repositories/reports.repository";

const CONTENT_SNAPSHOT_MAX_LENGTH = 2000;

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

const removeTarget = async (targetType: ReportTargetType, targetId: string): Promise<void> => {
  if (targetType === "review") await ReviewsService.deleteById(targetId);
  else if (targetType === "post") await PostsService.deleteById(targetId);
  else await ReportTargetsRepository.remove(targetType, targetId);
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
  ): Promise<{ error: string; status: 404 } | { success: true }> {
    const report = await ReportsRepository.findById(reportId);
    if (!report) {
      return { error: "Report not found", status: 404 };
    }

    await removeTarget(report.targetType, report.targetId);

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
