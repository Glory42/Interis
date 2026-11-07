import { z } from "zod";
import { appendPageParams, type AdminPage } from "@/features/admin/pagination";
import { apiRequest } from "@/lib/api-client";
import { reportReasonSchema, reportTargetTypeSchema } from "@/features/reports/api";
import { successResponseSchema, userSummarySchema } from "@/types/api";

export const reportStatusSchema = z.enum(["pending", "resolved", "dismissed"]);
export type ReportStatus = z.infer<typeof reportStatusSchema>;

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

const adminUserSchema = userSummarySchema.extend({
  email: z.string(),
  isAdmin: z.boolean(),
  isSuspended: z.boolean(),
  createdAt: z.coerce.date(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

const actionResponseSchema = successResponseSchema;

export const listReports = async (
  status?: ReportStatus,
  page?: AdminPage,
): Promise<ReportItem[]> => {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  appendPageParams(params, page);
  const query = params.toString();
  const response = await apiRequest<unknown>(`/api/reports${query ? `?${query}` : ""}`, {
    method: "GET",
  });
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

export const removeReportedContent = async (
  id: string,
  options: { reason?: string; notifyAuthor?: boolean } = {},
): Promise<void> => {
  const response = await apiRequest<unknown, typeof options>(`/api/reports/${id}/remove-content`, {
    method: "POST",
    body: options,
  });
  actionResponseSchema.parse(response);
};

export const listAdminUsers = async (query?: string, page?: AdminPage): Promise<AdminUser[]> => {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  appendPageParams(params, page);
  const search = params.toString();
  const response = await apiRequest<unknown>(`/api/admin/users${search ? `?${search}` : ""}`, {
    method: "GET",
  });
  return z.array(adminUserSchema).parse(response);
};

export const resetUserPassword = async (
  username: string,
  newPassword: string,
  adminPassword: string,
): Promise<void> => {
  const response = await apiRequest<unknown, { newPassword: string; adminPassword: string }>(
    `/api/admin/users/${encodeURIComponent(username)}/reset-password`,
    { method: "POST", body: { newPassword, adminPassword } },
  );
  actionResponseSchema.parse(response);
};

export const suspendUser = async (
  username: string,
  adminPassword: string,
  reason?: string,
): Promise<void> => {
  const response = await apiRequest<unknown, { reason?: string; adminPassword: string }>(
    `/api/admin/users/${encodeURIComponent(username)}/suspend`,
    { method: "POST", body: { reason, adminPassword } },
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

export const promoteUser = async (username: string, adminPassword: string): Promise<void> => {
  const response = await apiRequest<unknown, { adminPassword: string }>(
    `/api/admin/users/${encodeURIComponent(username)}/promote`,
    { method: "POST", body: { adminPassword } },
  );
  actionResponseSchema.parse(response);
};

export const demoteUser = async (username: string, adminPassword: string): Promise<void> => {
  const response = await apiRequest<unknown, { adminPassword: string }>(
    `/api/admin/users/${encodeURIComponent(username)}/demote`,
    { method: "POST", body: { adminPassword } },
  );
  actionResponseSchema.parse(response);
};

export const deleteUser = async (username: string, adminPassword: string): Promise<void> => {
  const response = await apiRequest<unknown, { adminPassword: string }>(
    `/api/admin/users/${encodeURIComponent(username)}`,
    { method: "DELETE", body: { adminPassword } },
  );
  actionResponseSchema.parse(response);
};
