import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

export const notificationTypeSchema = z.enum([
  "follow",
  "like_review",
  "like_post",
  "like_activity",
  "comment_review",
  "comment_post",
]);

const notificationItemSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  actorUsername: z.string(),
  actorDisplayUsername: z.string().nullish(),
  actorImage: z.string().nullish(),
  actorAvatarUrl: z.string().nullish(),
  type: notificationTypeSchema,
  entityId: z.string(),
  metadata: z.string().nullable(),
  isRead: z.boolean(),
  createdAt: z.coerce.date(),
});

const notificationPageSchema = z.object({
  items: z.array(notificationItemSchema),
  nextCursor: z.string().nullable(),
});

const unreadCountSchema = z.object({ count: z.number() });

export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationItem = z.infer<typeof notificationItemSchema>;
export type NotificationPage = z.infer<typeof notificationPageSchema>;

export const getNotifications = async (
  limit?: number,
  cursor?: string,
): Promise<NotificationPage> => {
  const params = new URLSearchParams();
  if (limit) params.set("limit", String(limit));
  if (cursor) params.set("cursor", cursor);
  const query = params.toString();

  const response = await apiRequest<unknown>(
    `/api/notifications${query ? `?${query}` : ""}`,
    { method: "GET" },
  );
  return notificationPageSchema.parse(response);
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await apiRequest<unknown>("/api/notifications/unread-count", {
    method: "GET",
  });
  return unreadCountSchema.parse(response).count;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await apiRequest(`/api/notifications/${id}/read`, { method: "POST" });
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await apiRequest("/api/notifications/read-all", { method: "POST" });
};
