import { LineRowsSkeleton, LoadingRegion } from "@/components/ui/PageSkeletons";
import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import type { NotificationItem, NotificationType } from "@/features/notifications/api";
import {
  useClearNotifications,
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationsList,
  useUnreadNotificationCount,
} from "@/features/notifications/hooks/useNotifications";
import { formatRelativeTime } from "@/lib/time";

const messageByType: Record<NotificationType, string> = {
  follow: "started following you",
  like_review: "liked your review",
  like_post: "liked your post",
  like_activity: "liked your activity",
  comment_review: "commented on your review",
  comment_post: "commented on your post",
  content_removed: "",
};

const REMOVED_LABEL: Record<string, string> = { review: "review", post: "post", comment: "comment", post_comment: "comment", list: "list" };

const parseRemoval = (metadata: string | null) => {
  try {
    const parsed = JSON.parse(metadata ?? "{}") as { targetType?: string; reason?: string | null; excerpt?: string };
    return {
      label: REMOVED_LABEL[parsed.targetType ?? ""] ?? "post",
      detail: [parsed.excerpt ? `“${parsed.excerpt}”` : null, parsed.reason || null].filter(Boolean).join(" · "),
    };
  } catch {
    return { label: "post", detail: "" };
  }
};

const rowClass = "group/notification relative border-b border-border/50 last:border-0";

const headerAction =
  "font-mono text-[9px] uppercase tracking-[0.12em] transition-colors disabled:opacity-50";

// Sits beside the row's link, not inside it, so it never navigates. Shown on
// hover/focus with a mouse, always on touch screens.
const DeleteNotificationButton = ({ onDelete }: { onDelete: () => void }) => (
  <button
    type="button"
    onClick={onDelete}
    aria-label="Delete notification"
    title="Delete notification"
    className="absolute right-1.5 top-1.5 flex size-7 items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-foreground/[0.06] hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 group-hover/notification:opacity-100 group-focus-within/notification:opacity-100 [@media(hover:none)]:opacity-100"
  >
    <X aria-hidden className="size-3.5" />
  </button>
);

// Moderation notices have no actor to show and nothing left to link to.
const RemovalNotice = ({ notification, onRead }: { notification: NotificationItem; onRead: () => void }) => {
  const { label, detail } = parseRemoval(notification.metadata);
  return (
    <button
      type="button"
      onClick={onRead}
      className={"block w-full py-2.5 pl-3 pr-9 text-left " + (notification.isRead ? "" : "bg-primary/5")}
    >
      <span className="block font-mono text-[11px] text-foreground">{`A moderator removed your ${label}`}</span>
      {detail ? <span className="block font-mono text-[10px] text-muted-foreground">{detail}</span> : null}
      <span className="block font-mono text-[9px] text-muted-foreground">
        {formatRelativeTime(notification.createdAt.toISOString())}
      </span>
    </button>
  );
};

type NotificationLink =
  | { to: "/reviews/$username/$reviewId"; params: { username: string; reviewId: string } }
  | { to: "/profile/$username"; params: { username: string } };

const resolveNotificationLink = (
  notification: NotificationItem,
  ownUsername: string,
): NotificationLink => {
  if (notification.type === "like_review" || notification.type === "comment_review") {
    return {
      to: "/reviews/$username/$reviewId",
      params: { username: ownUsername, reviewId: notification.entityId },
    };
  }

  return {
    to: "/profile/$username",
    params: { username: notification.actorUsername },
  };
};

export const NotificationsBell = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const unreadCountQuery = useUnreadNotificationCount(Boolean(user));
  const listQuery = useNotificationsList(isOpen);
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();
  const deleteMutation = useDeleteNotification();
  const clearMutation = useClearNotifications();
  // "Clear all" asks once more before emptying the bell.
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  const closeMenu = () => {
    setIsOpen(false);
    setIsConfirmingClear(false);
  };

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
        setIsConfirmingClear(false);
      }
    };

    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [isOpen]);

  if (!user) {
    return null;
  }

  const unreadCount = unreadCountQuery.data ?? 0;
  const notifications = listQuery.data?.items ?? [];

  return (
    <div ref={menuRef} className="relative self-stretch flex items-center">
      <button
        type="button"
        onClick={() => (isOpen ? closeMenu() : setIsOpen(true))}
        className="relative flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open notifications"
      >
        <Bell className="h-3.5 w-3.5" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 font-mono text-[8px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-[calc(100%-1px)] z-50 w-72 rounded-xl border bg-popover/95 backdrop-blur-md animate-fade-up overflow-hidden"
          style={{ borderColor: "color-mix(in srgb, var(--primary) 30%, transparent)" }}
          role="menu"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-border/70 px-3 py-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
              Notifications
            </p>
            <div className="flex items-center gap-3">
              {unreadCount > 0 ? (
                <button
                  type="button"
                  disabled={markAllReadMutation.isPending}
                  onClick={() => markAllReadMutation.mutate()}
                  className={`${headerAction} text-muted-foreground hover:text-foreground`}
                >
                  Mark all read
                </button>
              ) : null}
              {notifications.length > 0 ? (
                <button
                  type="button"
                  disabled={clearMutation.isPending}
                  onClick={() => {
                    setIsConfirmingClear(!isConfirmingClear);
                    if (isConfirmingClear) clearMutation.mutate();
                  }}
                  aria-label={isConfirmingClear ? "Confirm clearing all notifications" : "Clear all notifications"}
                  className={`${headerAction} ${isConfirmingClear ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
                >
                  {isConfirmingClear ? "Confirm clear" : "Clear all"}
                </button>
              ) : null}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {listQuery.isPending ? (
              <LoadingRegion label="Loading notifications" className="px-3">
                <LineRowsSkeleton count={4} />
              </LoadingRegion>
            ) : notifications.length === 0 ? (
              <p className="py-8 text-center font-mono text-xs text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              <ul>
                {notifications.map((notification) => {
                  if (notification.type === "content_removed") {
                    return (
                      <li key={notification.id} className={rowClass}>
                        <RemovalNotice
                          notification={notification}
                          onRead={() => !notification.isRead && markReadMutation.mutate(notification.id)}
                        />
                        <DeleteNotificationButton onDelete={() => deleteMutation.mutate(notification.id)} />
                      </li>
                    );
                  }
                  const avatarUrl =
                    notification.actorAvatarUrl ?? notification.actorImage ?? null;
                  const link = resolveNotificationLink(notification, user.username);

                  return (
                    <li key={notification.id} className={rowClass}>
                      <Link
                        to={link.to}
                        params={link.params}
                        onClick={() => {
                          closeMenu();
                          if (!notification.isRead) {
                            markReadMutation.mutate(notification.id);
                          }
                        }}
                        className={
                          "flex items-start gap-2.5 rounded-lg py-2.5 pl-3 pr-9 text-left transition-colors hover:bg-secondary/25 " +
                          (notification.isRead ? "" : "bg-primary/5")
                        }
                      >
                        <FeedActorAvatar
                          avatarUrl={avatarUrl}
                          username={notification.actorUsername}
                          initial={notification.actorUsername.slice(0, 1).toUpperCase()}
                          className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden border border-border/60"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block font-mono text-[11px] text-foreground">
                            <span className="font-semibold">
                              {notification.actorDisplayUsername ?? notification.actorUsername}
                            </span>{" "}
                            {messageByType[notification.type]}
                          </span>
                          <span className="block font-mono text-[9px] text-muted-foreground">
                            {formatRelativeTime(notification.createdAt.toISOString())}
                          </span>
                        </span>
                        {!notification.isRead ? (
                          <span
                            className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                            aria-hidden="true"
                          />
                        ) : null}
                      </Link>
                      <DeleteNotificationButton onDelete={() => deleteMutation.mutate(notification.id)} />
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
