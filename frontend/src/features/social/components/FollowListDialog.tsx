import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import {
  useFollowers,
  useFollowing,
  useUnfollowFromList,
  useRemoveFollowerFromList,
} from "@/features/social/hooks/useSocial";

type FollowListDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  mode: "followers" | "following";
  profileUsername: string;
  isOwnProfile: boolean;
};

export const FollowListDialog = ({
  isOpen,
  onClose,
  mode,
  profileUsername,
  isOwnProfile,
}: FollowListDialogProps) => {
  const followersQuery = useFollowers(profileUsername, isOpen && mode === "followers");
  const followingQuery = useFollowing(profileUsername, isOpen && mode === "following");
  const unfollowMutation = useUnfollowFromList(profileUsername);
  const removeFollowerMutation = useRemoveFollowerFromList(profileUsername);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const query = mode === "followers" ? followersQuery : followingQuery;
  const users = query.data ?? [];
  const title = mode === "followers" ? "Followers" : "Following";
  const emptyText =
    mode === "followers" ? "No followers yet." : "Not following anyone yet.";
  const isMutating =
    unfollowMutation.isPending || removeFollowerMutation.isPending;

  return (
    <div className="theme-modal-overlay fixed inset-0 z-140 bg-background/70 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative mx-auto flex h-full w-full max-w-sm items-start px-4 pt-16 sm:pt-20">
        <section className="theme-modal-panel relative w-full overflow-hidden border border-border/80 bg-card/95 p-0 animate-fade-up">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {title}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {query.isPending ? (
              <div className="flex items-center justify-center py-10">
                <Spinner />
              </div>
            ) : query.isError ? (
              <p className="py-10 text-center font-mono text-xs text-muted-foreground">
                Could not load {title.toLowerCase()}.
              </p>
            ) : users.length === 0 ? (
              <p className="py-10 text-center font-mono text-xs text-muted-foreground">
                {emptyText}
              </p>
            ) : (
              <ul>
                {users.map((u) => {
                  const avatarUrl = u.avatarUrl ?? u.image ?? null;
                  const initial = u.username.slice(0, 1).toUpperCase();
                  const isPendingThisUser =
                    isMutating &&
                    (unfollowMutation.variables === u.username ||
                      removeFollowerMutation.variables === u.username);

                  return (
                    <li
                      key={u.id}
                      className="flex items-center gap-3 border-b border-border/50 px-4 py-3 last:border-0"
                    >
                      <Link
                        to="/profile/$username"
                        params={{ username: u.username }}
                        onClick={onClose}
                        className="shrink-0"
                      >
                        <FeedActorAvatar
                          avatarUrl={avatarUrl}
                          username={u.username}
                          initial={initial}
                          className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden border border-border/60"
                        />
                      </Link>

                      <Link
                        to="/profile/$username"
                        params={{ username: u.username }}
                        onClick={onClose}
                        className="min-w-0 flex-1"
                      >
                        <p className="truncate font-mono text-sm font-medium text-foreground">
                          {u.displayUsername ?? u.username}
                        </p>
                        <p className="truncate font-mono text-[10px] text-muted-foreground">
                          @{u.username}
                        </p>
                      </Link>

                      {isOwnProfile ? (
                        mode === "following" ? (
                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() => {
                              unfollowMutation.mutate(u.username);
                            }}
                            className="shrink-0 border border-border/70 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isPendingThisUser ? "Saving" : "Unfollow"}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isMutating}
                            onClick={() => {
                              removeFollowerMutation.mutate(u.username);
                            }}
                            className="shrink-0 border border-border/70 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isPendingThisUser ? "Saving" : "Remove"}
                          </button>
                        )
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
