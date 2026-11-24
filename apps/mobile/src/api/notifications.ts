import { z } from "zod";
import { apiRequest } from "./client";
import { notificationPageSchema, type NotificationPage } from "@/types/notifications";

export const getNotifications = async (cursor?: string): Promise<NotificationPage> => {
  const params = new URLSearchParams({ limit: "20" });
  if (cursor) params.set("cursor", cursor);

  const response = await apiRequest<unknown>(`/api/notifications?${params.toString()}`);
  return notificationPageSchema.parse(response);
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const response = await apiRequest<unknown>("/api/notifications/unread-count");
  return z.object({ count: z.number() }).parse(response).count;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  await apiRequest(`/api/notifications/${id}/read`, { method: "POST" });
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await apiRequest("/api/notifications/read-all", { method: "POST" });
};
