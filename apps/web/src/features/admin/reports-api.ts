import { z } from "zod";
import { appendPageParams, type AdminPage } from "@/features/admin/pagination";
import { reportReasonSchema, reportTargetTypeSchema } from "@/features/reports/api";
import { apiRequest } from "@/lib/api-client";
import type { ReportStatus } from "@/features/admin/api";

const groupedReportSchema = z.object({
  targetType: reportTargetTypeSchema,
  targetId: z.string(),
  reportCount: z.number(),
  reasons: z.array(reportReasonSchema),
  contentSnapshot: z.string(),
  authorUsername: z.string().nullable(),
  oldestReportAt: z.coerce.date(),
  reportId: z.string(),
  reports: z.array(z.object({ reporterUsername: z.string().nullable(), reason: reportReasonSchema, details: z.string().nullable() })),
});

export type GroupedReport = z.infer<typeof groupedReportSchema>;

export const REPORT_TYPE_LABEL: Record<GroupedReport["targetType"], string> = {
  review: "Review",
  post: "Post",
  comment: "Comment",
  post_comment: "Comment",
  list: "List",
};

export const listGroupedReports = async (status: ReportStatus, page: AdminPage): Promise<GroupedReport[]> => {
  const params = new URLSearchParams({ status });
  appendPageParams(params, page);
  return z.array(groupedReportSchema).parse(await apiRequest<unknown>(`/api/reports/grouped?${params}`));
};

export const dismissReportTarget = async (target: { targetType: string; targetId: string; note: string }): Promise<void> => {
  await apiRequest<unknown, { note: string }>(
    `/api/reports/targets/${target.targetType}/${encodeURIComponent(target.targetId)}/dismiss`,
    { method: "POST", body: { note: target.note } },
  );
};
