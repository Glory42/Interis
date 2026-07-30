import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Bell } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import type { NotificationItem, NotificationType } from "@/features/notifications/api";
import {
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
        onClick={() => setIsOpen((current) => !current)}
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
            {unreadCount > 0 ? (
              <button
                type="button"
                disabled={markAllReadMutation.isPending}
                onClick={() => markAllReadMutation.mutate()}
                className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {listQuery.isPending ? (
              <div className="flex items-center justify-center py-8">
                <Spinner />
              </div>
            ) : notifications.length === 0 ? (
              <p className="py-8 text-center font-mono text-xs text-muted-foreground">
                No notifications yet.
              </p>
            ) : (
              <ul>
                {notifications.map((notification) => {
                  const avatarUrl =
                    notification.actorAvatarUrl ?? notification.actorImage ?? null;
                  const link = resolveNotificationLink(notification, user.username);

                  return (
                    <li key={notification.id}>
                      <Link
                        to={link.to}
                        params={link.params}
                        onClick={() => {
                          setIsOpen(false);
                          if (!notification.isRead) {
                            markReadMutation.mutate(notification.id);
                          }
                        }}
                        className={
                          "flex items-start gap-2.5 rounded-lg border-b border-border/50 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-secondary/25 " +
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
