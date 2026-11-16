import { Link } from "@tanstack/react-router";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import type { NotificationItem } from "@/features/notifications/api";
import { useAcceptListInvite, useDeclineListInvite } from "@/features/lists/hooks/useListCollaborators";
import { formatRelativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { listTitleFrom } from "@/features/lists/list-notification-metadata";

const action = "rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] disabled:opacity-50";

// A List Collaborator invite, answered right in the bell; answering resolves the notification.
export const ListInviteNotification = ({ notification, onNavigate }: { notification: NotificationItem; onNavigate: () => void }) => {
  const { user } = useAuth();
  const acceptMutation = useAcceptListInvite(user?.username);
  const declineMutation = useDeclineListInvite(user?.id, user?.username);
  const isPending = acceptMutation.isPending || declineMutation.isPending;
  const listTitle = listTitleFrom(notification.metadata);
  const actorName = notification.actorDisplayUsername ?? notification.actorUsername;

  return (
    <div className={cn("flex items-start gap-2.5 py-2.5 pl-3 pr-9", !notification.isRead && "bg-primary/5")}>
      <FeedActorAvatar
        avatarUrl={notification.actorAvatarUrl ?? notification.actorImage ?? null}
        username={notification.actorUsername}
        initial={notification.actorUsername.slice(0, 1).toUpperCase()}
        className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden border border-border/60"
      />
      <span className="min-w-0 flex-1">
        <Link
          to="/profile/$username/lists/$listId"
          params={{ username: notification.actorUsername, listId: notification.entityId }}
          onClick={onNavigate}
          className="block font-mono text-[11px] text-foreground hover:underline"
        >
          <span className="font-semibold">{actorName}</span>
          {listTitle ? ` invited you to edit “${listTitle}”` : " invited you to edit a list"}
        </Link>
        <span className="block font-mono text-[9px] text-muted-foreground">
          {formatRelativeTime(notification.createdAt.toISOString())}
        </span>
        <span className="mt-1.5 flex gap-1.5">
          <button
            type="button"
            disabled={isPending}
            onClick={() => acceptMutation.mutate(notification.entityId)}
            className={cn(action, "border-primary/45 bg-primary/10 text-primary")}
          >
            Accept
          </button>
          <button
            type="button"
            disabled={isPending}
            onClick={() => declineMutation.mutate(notification.entityId)}
            className={cn(action, "border-border/70 text-muted-foreground hover:text-foreground")}
          >
            Decline
          </button>
        </span>
      </span>
    </div>
  );
};
