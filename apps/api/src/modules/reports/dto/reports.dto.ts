import { z } from "zod";
import { paginationQuerySchema } from "../../../commons/validation/common.schemas";

export const SubmitReportSchema = z.object({
  targetType: z.enum(["review", "post"]),
  targetId: z.string().min(1),
  reason: z.enum(["spam", "harassment", "inappropriate", "other"]),
  details: z.string().trim().max(1000).optional(),
});

export type SubmitReportDto = z.infer<typeof SubmitReportSchema>;

export const ListReportsQuerySchema = z.object({
  status: z.enum(["pending", "resolved", "dismissed"]).optional(),
  ...paginationQuerySchema.shape,
});

export type ListReportsQuery = z.input<typeof ListReportsQuerySchema>;

export const ReportParamsSchema = z.object({
  id: z.string().uuid(),
});

export type ReportParams = z.input<typeof ReportParamsSchema>;
