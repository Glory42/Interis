import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "follow",
  "like_review",
  "like_post",
  "like_activity",
  "comment_review",
  "comment_post",
]);

export const notificationItemSchema = z.object({
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

export const notificationPageSchema = z.object({
  items: z.array(notificationItemSchema),
  nextCursor: z.string().nullable(),
});

export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type NotificationItem = z.infer<typeof notificationItemSchema>;
export type NotificationPage = z.infer<typeof notificationPageSchema>;
