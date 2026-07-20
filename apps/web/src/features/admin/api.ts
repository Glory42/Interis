import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

export const reportStatusSchema = z.enum(["pending", "resolved", "dismissed"]);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

const reportTargetTypeSchema = z.enum(["review", "post"]);
const reportReasonSchema = z.enum(["spam", "harassment", "inappropriate", "other"]);

const reportItemSchema = z.object({
  id: z.string(),
  reporterId: z.string(),
  reporterUsername: z.string(),
  targetType: reportTargetTypeSchema,
  targetId: z.string(),
  contentSnapshot: z.string(),
  reason: reportReasonSchema,
  details: z.string().nullable(),
  status: reportStatusSchema,
  createdAt: z.coerce.date(),
  resolvedAt: z.coerce.date().nullable(),
});
export type ReportItem = z.infer<typeof reportItemSchema>;

const adminUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayUsername: z.string().nullable(),
  email: z.string(),
  avatarUrl: z.string().nullable(),
  isAdmin: z.boolean(),
  isSuspended: z.boolean(),
  createdAt: z.coerce.date(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

const actionResponseSchema = z.object({ success: z.boolean() });

export const listReports = async (status?: ReportStatus): Promise<ReportItem[]> => {
  const query = status ? `?status=${status}` : "";
  const response = await apiRequest<unknown>(`/api/reports${query}`, { method: "GET" });
  return z.array(reportItemSchema).parse(response);
};

export const resolveReport = async (id: string): Promise<void> => {
  const response = await apiRequest<unknown>(`/api/reports/${id}/resolve`, { method: "POST" });
  actionResponseSchema.parse(response);
};

export const dismissReport = async (id: string): Promise<void> => {
  const response = await apiRequest<unknown>(`/api/reports/${id}/dismiss`, { method: "POST" });
  actionResponseSchema.parse(response);
};

export const removeReportedContent = async (id: string): Promise<void> => {
  const response = await apiRequest<unknown>(`/api/reports/${id}/remove-content`, {
    method: "POST",
  });
  actionResponseSchema.parse(response);
};

export const listAdminUsers = async (query?: string): Promise<AdminUser[]> => {
  const params = query ? `?query=${encodeURIComponent(query)}` : "";
  const response = await apiRequest<unknown>(`/api/admin/users${params}`, { method: "GET" });
  return z.array(adminUserSchema).parse(response);
};

export const resetUserPassword = async (
  username: string,
  newPassword: string,
): Promise<void> => {
  const response = await apiRequest<unknown, { newPassword: string }>(
    `/api/admin/users/${encodeURIComponent(username)}/reset-password`,
    { method: "POST", body: { newPassword } },
  );
  actionResponseSchema.parse(response);
};

export const suspendUser = async (username: string, reason?: string): Promise<void> => {
  const response = await apiRequest<unknown, { reason?: string }>(
    `/api/admin/users/${encodeURIComponent(username)}/suspend`,
    { method: "POST", body: { reason } },
  );
  actionResponseSchema.parse(response);
};

export const unsuspendUser = async (username: string): Promise<void> => {
  const response = await apiRequest<unknown>(
    `/api/admin/users/${encodeURIComponent(username)}/unsuspend`,
    { method: "POST" },
  );
  actionResponseSchema.parse(response);
};

export const promoteUser = async (username: string): Promise<void> => {
  const response = await apiRequest<unknown>(
    `/api/admin/users/${encodeURIComponent(username)}/promote`,
    { method: "POST" },
  );
  actionResponseSchema.parse(response);
};

export const demoteUser = async (username: string): Promise<void> => {
  const response = await apiRequest<unknown>(
    `/api/admin/users/${encodeURIComponent(username)}/demote`,
    { method: "POST" },
  );
  actionResponseSchema.parse(response);
};

export const deleteUser = async (username: string): Promise<void> => {
  const response = await apiRequest<unknown>(
    `/api/admin/users/${encodeURIComponent(username)}`,
    { method: "DELETE" },
  );
  actionResponseSchema.parse(response);
};
