import { z } from "zod";
import { paginationQuerySchema } from "../../../commons/validation/common.schemas";

export const SubmitReportSchema = z.object({
  targetType: z.enum(["review", "post", "comment", "post_comment", "list"]),
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

export const GroupedReportsQuerySchema = z.object({
  status: z.enum(["pending", "resolved", "dismissed"]).default("pending"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export const ReportTargetParamsSchema = z.object({
  targetType: z.enum(["review", "post", "comment", "post_comment", "list"]),
  targetId: z.string().uuid(),
});

export type ReportTargetParams = z.input<typeof ReportTargetParamsSchema>;

export const CloseReportTargetSchema = z.object({
  note: z.string().trim().max(500).optional(),
});
