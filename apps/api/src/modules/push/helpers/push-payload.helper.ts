import type { PushNotificationType } from "../constants/push.constants";

export type PushPayload = { title: string; body: string; url: string; tag: string };

const ACTION_BY_TYPE: Record<Exclude<PushNotificationType, "content_removed">, string> = {
  follow: "started following you",
  like_review: "liked your review",
  like_post: "liked your post",
  like_activity: "liked your activity",
  comment_review: "commented on your review",
  comment_post: "commented on your post",
  list_invite: "invited you to edit a list",
  list_invite_accepted: "joined your list",
};

const REMOVED_LABEL: Record<string, string> = {
  review: "review",
  post: "post",
  comment: "comment",
  post_comment: "comment",
  list: "list",
};

const parseTargetType = (metadata: string | undefined): string | undefined => {
  try {
    return (JSON.parse(metadata ?? "{}") as { targetType?: string }).targetType;
  } catch {
    return undefined;
  }
};

// Only public facts go in: usernames and what happened, never comment text or a removal reason.
export const buildPushPayload = (
  notification: { type: PushNotificationType; entityId: string; metadata?: string },
  names: { actorUsername: string | null; recipientUsername: string | null },
): PushPayload => {
  const tag = `${notification.type}:${notification.entityId}`;

  if (notification.type === "content_removed") {
    const label = REMOVED_LABEL[parseTargetType(notification.metadata) ?? ""] ?? "post";
    return { title: "Interis", body: `A moderator removed your ${label}`, url: "/", tag };
  }

  const actor = names.actorUsername ? `@${names.actorUsername}` : "Someone";
  const body = `${actor} ${ACTION_BY_TYPE[notification.type]}`;
  const isReviewNotice = notification.type === "like_review" || notification.type === "comment_review";

  let url = "/";
  // entityId is the list; its owner is the actor of an invite and the recipient of an acceptance.
  const listOwner = notification.type === "list_invite" ? names.actorUsername : names.recipientUsername;
  if (notification.type === "list_invite" || notification.type === "list_invite_accepted") {
    url = listOwner
      ? `/profile/${encodeURIComponent(listOwner)}/lists/${encodeURIComponent(notification.entityId)}`
      : "/";
  } else if (isReviewNotice && names.recipientUsername) {
    url = `/reviews/${encodeURIComponent(names.recipientUsername)}/${encodeURIComponent(notification.entityId)}`;
  } else if (!isReviewNotice && names.actorUsername) {
    url = `/profile/${encodeURIComponent(names.actorUsername)}`;
  }

  return { title: "Interis", body, url, tag };
};
