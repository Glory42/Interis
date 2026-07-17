import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

export const reportReasonSchema = z.enum(["spam", "harassment", "inappropriate", "other"]);
export type ReportReason = z.infer<typeof reportReasonSchema>;

export const reportTargetTypeSchema = z.enum(["review", "post"]);
export type ReportTargetType = z.infer<typeof reportTargetTypeSchema>;

const reportActionResponseSchema = z.object({ success: z.boolean() });

export type SubmitReportInput = {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
};

export const submitReport = async (input: SubmitReportInput): Promise<void> => {
  const response = await apiRequest<unknown, SubmitReportInput>("/api/reports", {
    method: "POST",
    body: input,
  });
  reportActionResponseSchema.parse(response);
};
