import type { notificationTypeEnum } from "../../notifications/notifications.entity";

export const MAX_SUBSCRIPTIONS_PER_USER = 10;
// Consecutive failed deliveries (not 404/410) before a subscription is dropped.
export const MAX_DELIVERY_FAILURES = 5;
export const LAST_USED_REFRESH_MS = 24 * 60 * 60 * 1000;

export const PUSH_CATEGORIES = ["follows", "likes", "comments", "moderation"] as const;
export type PushCategory = (typeof PUSH_CATEGORIES)[number];
export type PushPreferences = Record<PushCategory, boolean>;

export const DEFAULT_PUSH_PREFERENCES: PushPreferences = {
  follows: true,
  likes: true,
  comments: true,
  moderation: true,
};

export type PushNotificationType = (typeof notificationTypeEnum.enumValues)[number];

export const PUSH_CATEGORY_BY_TYPE: Record<PushNotificationType, PushCategory> = {
  follow: "follows",
  like_review: "likes",
  like_post: "likes",
  like_activity: "likes",
  comment_review: "comments",
  comment_post: "comments",
  content_removed: "moderation",
};

// The server POSTs to whatever endpoint a browser hands it, so only known push services are accepted.
export const PUSH_SERVICE_HOST_SUFFIXES = [
  "fcm.googleapis.com",
  "push.services.mozilla.com",
  "notify.windows.com",
  "push.apple.com",
] as const;
