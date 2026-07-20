import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const actionResponseSchema = z.object({ success: z.boolean() });

const adminListSchema = z.object({
  id: z.string(),
  userId: z.string(),
  authorUsername: z.string(),
  title: z.string(),
  isPublic: z.boolean(),
  isRanked: z.boolean(),
  derivedType: z.string().nullable(),
  itemCount: z.number(),
  createdAt: z.coerce.date(),
});
export type AdminList = z.infer<typeof adminListSchema>;

export const listAdminLists = async (username?: string): Promise<AdminList[]> => {
  const query = username ? `?username=${encodeURIComponent(username)}` : "";
  const response = await apiRequest<unknown>(`/api/admin/lists${query}`, { method: "GET" });
  return z.array(adminListSchema).parse(response);
};

export const deleteAdminList = async (id: string): Promise<void> => {
  const response = await apiRequest<unknown>(`/api/admin/lists/${id}`, { method: "DELETE" });
  actionResponseSchema.parse(response);
};

export const activityTypeSchema = z.enum([
  "diary_entry",
  "review",
  "liked_movie",
  "watchlisted_movie",
  "followed_user",
  "created_list",
  "liked_review",
  "commented",
  "post",
]);
export type ActivityType = z.infer<typeof activityTypeSchema>;

const adminActivitySchema = z.object({
  id: z.string(),
  userId: z.string(),
  authorUsername: z.string(),
  type: activityTypeSchema,
  entityId: z.string(),
  createdAt: z.coerce.date(),
});
export type AdminActivity = z.infer<typeof adminActivitySchema>;

export type AdminActivityFilters = { username?: string; type?: ActivityType };

export const listAdminActivities = async (
  filters: AdminActivityFilters,
): Promise<AdminActivity[]> => {
  const params = new URLSearchParams();
  if (filters.username) params.set("username", filters.username);
  if (filters.type) params.set("type", filters.type);
  const query = params.toString();
  const response = await apiRequest<unknown>(`/api/admin/activities${query ? `?${query}` : ""}`, {
    method: "GET",
  });
  return z.array(adminActivitySchema).parse(response);
};

export const deleteAdminActivity = async (id: string): Promise<void> => {
  const response = await apiRequest<unknown>(`/api/admin/activities/${id}`, { method: "DELETE" });
  actionResponseSchema.parse(response);
};
