import { LineRowsSkeleton, LoadingRegion } from "@/components/ui/PageSkeletons";
import { memo, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { UserMinus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalShell } from "@/components/ui/ModalShell";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import type { FollowUser } from "@/features/social/api";
import { FollowToggleButton } from "@/features/social/components/FollowToggleButton";
import {
  useFollowers,
  useFollowing,
  useFollowToggle,
  useRemoveFollowerFromList,
  type FollowToggleVariables,
} from "@/features/social/hooks/useSocial";
import { useViewerFollows } from "@/features/social/hooks/useViewerFollows";

type FollowListDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "followers" | "following";
  profileUsername: string;
  isOwnProfile: boolean;
};

type FollowListRowProps = {
  user: FollowUser;
  onClose: () => void;
  // null hides the toggle: signed out, or the viewer's own row.
  followStatus: "following" | "not-following" | "loading" | null;
  followLabel: string;
  isTogglePending: boolean;
  onToggleFollow: (variables: FollowToggleVariables) => void;
  // Set only on your own followers list.
  onRemove?: (username: string) => void;
  isRemovePending: boolean;
};

const FollowListRowBase = ({
  user,
  onClose,
  followStatus,
  followLabel,
  isTogglePending,
  onToggleFollow,
  onRemove,
  isRemovePending,
}: FollowListRowProps) => (
  <li className="flex items-center gap-3 border-b border-border/50 px-4 py-3 last:border-0">
    <Link to="/profile/$username" params={{ username: user.username }} onClick={onClose} className="shrink-0">
      <FeedActorAvatar
        avatarUrl={user.avatarUrl ?? null}
        username={user.username}
        initial={user.username.slice(0, 1).toUpperCase()}
        className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden border border-border/60"
      />
    </Link>

    <Link to="/profile/$username" params={{ username: user.username }} onClick={onClose} className="min-w-0 flex-1">
      <p className="truncate font-mono text-sm font-medium text-foreground">{user.displayUsername ?? user.username}</p>
      <p className="truncate font-mono text-[10px] text-muted-foreground">@{user.username}</p>
    </Link>

    {followStatus === "loading" ? (
      <span aria-hidden className="h-9 w-22 shrink-0 animate-pulse rounded-md bg-muted/30 sm:h-7" />
    ) : followStatus ? (
      <FollowToggleButton
        username={user.username}
        isFollowing={followStatus === "following"}
        isPending={isTogglePending}
        followLabel={followLabel}
        onToggle={() =>
          onToggleFollow({ userId: user.id, username: user.username, follow: followStatus !== "following" })
        }
      />
    ) : null}

    {onRemove ? (
      <Button
        type="button"
        size="sm"
        variant="icon"
        disabled={isRemovePending}
        onClick={() => onRemove(user.username)}
        aria-label={`Remove @${user.username} from your followers`}
        title="Remove follower"
        className="shrink-0 hover:border-destructive/55 hover:text-destructive"
      >
        <UserMinus aria-hidden className="size-3.5" />
      </Button>
    ) : null}
  </li>
);

// Toggling one row re-renders only that row.
const FollowListRow = memo(FollowListRowBase);

export const FollowListDialog = ({
  isOpen,
  onClose,
  mode,
  profileUsername,
  isOwnProfile,
}: FollowListDialogProps) => {
  const { user: viewer } = useAuth();
  const followersQuery = useFollowers(profileUsername, isOpen && mode === "followers");
  const followingQuery = useFollowing(profileUsername, isOpen && mode === "following");
  const followToggle = useFollowToggle();
  const removeFollowerMutation = useRemoveFollowerFromList(profileUsername);

  const query = mode === "followers" ? followersQuery : followingQuery;
  const users = useMemo(() => query.data ?? [], [query.data]);
  const otherUserIds = useMemo(
    () => users.filter((u) => u.id !== viewer?.id).map((u) => u.id),
    [users, viewer?.id],
  );
  const { followedIds, isLoaded } = useViewerFollows(otherUserIds, isOpen && Boolean(viewer));

  if (!isOpen) return null;

  const title = mode === "followers" ? "Followers" : "Following";
  const emptyText = mode === "followers" ? "No followers yet." : "Not following anyone yet.";
  const canRemove = isOwnProfile && mode === "followers";
  const pendingToggleId = followToggle.isPending ? followToggle.variables?.userId : undefined;
  const pendingRemoval = removeFollowerMutation.isPending ? removeFollowerMutation.variables : undefined;

  const followStatusOf = (userId: string): FollowListRowProps["followStatus"] => {
    if (!viewer || userId === viewer.id) return null;
    if (!isLoaded) return "loading";
    return followedIds.has(userId) ? "following" : "not-following";
  };

  return (
    <ModalShell onClose={onClose} containerClassName="max-w-sm">
      <section className="theme-modal-panel relative w-full overflow-hidden border border-border/80 bg-card/95 p-0 animate-fade-up">
        <ModalHeader title={title} onClose={onClose} closeAriaLabel={`Close ${title.toLowerCase()} dialog`} />

        <div className="max-h-[420px] overflow-y-auto">
          {query.isPending ? (
            <LoadingRegion label={`Loading ${title.toLowerCase()}`} className="px-4">
              <LineRowsSkeleton count={5} />
            </LoadingRegion>
          ) : query.isError ? (
            <p className="py-10 text-center font-mono text-xs text-muted-foreground">
              Could not load {title.toLowerCase()}.
            </p>
          ) : users.length === 0 ? (
            <p className="py-10 text-center font-mono text-xs text-muted-foreground">{emptyText}</p>
          ) : (
            <ul>
              {users.map((u) => (
                <FollowListRow
                  key={u.id}
                  user={u}
                  onClose={onClose}
                  followStatus={followStatusOf(u.id)}
                  followLabel={canRemove ? "Follow back" : "Follow"}
                  isTogglePending={pendingToggleId === u.id}
                  onToggleFollow={followToggle.mutate}
                  onRemove={canRemove ? removeFollowerMutation.mutate : undefined}
                  isRemovePending={pendingRemoval === u.username}
                />
              ))}
            </ul>
          )}
        </div>
      </section>
    </ModalShell>
  );
};
