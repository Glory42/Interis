import { ReviewsService } from "../reviews/reviews.service";
import { PostsService } from "../posts/posts.service";
import {
  ReportsRepository,
  type ReportReason,
  type ReportStatus,
  type ReportTargetType,
} from "./repositories/reports.repository";

const CONTENT_SNAPSHOT_MAX_LENGTH = 2000;

export class ReportsService {
  static async submitReport(
    reporterId: string,
    targetType: ReportTargetType,
    targetId: string,
    reason: ReportReason,
    details?: string,
  ): Promise<{ error: string; status: 404 } | { success: true }> {
    const content =
      targetType === "review"
        ? (await ReviewsService.findById(targetId))?.review.content
        : (await PostsService.findById(targetId))?.content;

    if (content === undefined) {
      return { error: `${targetType === "review" ? "Review" : "Post"} not found`, status: 404 };
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
}
