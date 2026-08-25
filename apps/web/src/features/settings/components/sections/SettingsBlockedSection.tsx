import { Link } from "@tanstack/react-router";
import { Spinner } from "@/components/ui/spinner";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import type { ModeratedUser } from "@/features/moderation/api";
import {
  useBlockedUsers,
  useMutedUsers,
  useUnblockUser,
  useUnmuteUser,
} from "@/features/moderation/hooks/useModeration";

const rowClass =
  "flex items-center gap-3 border-b px-4 py-2.5 last:border-0 settings-shell-row-border";

const UnblockButton = ({ username }: { username: string }) => {
  const unblockMutation = useUnblockUser(username);

  return (
    <button
      type="button"
      disabled={unblockMutation.isPending}
      onClick={() => unblockMutation.mutate()}
      className="shrink-0 border px-3 py-1.5 text-xs font-medium transition-colors settings-shell-border settings-shell-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {unblockMutation.isPending ? "Saving" : "Unblock"}
    </button>
  );
};

const UnmuteButton = ({ username }: { username: string }) => {
  const unmuteMutation = useUnmuteUser(username);

  return (
    <button
      type="button"
      disabled={unmuteMutation.isPending}
      onClick={() => unmuteMutation.mutate()}
      className="shrink-0 border px-3 py-1.5 text-xs font-medium transition-colors settings-shell-border settings-shell-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {unmuteMutation.isPending ? "Saving" : "Unmute"}
    </button>
  );
};

const UserRow = ({
  moderatedUser,
  action,
}: {
  moderatedUser: ModeratedUser;
  action: "unblock" | "unmute";
}) => {
  const avatarUrl = moderatedUser.avatarUrl ?? null;
  const initial = moderatedUser.username.slice(0, 1).toUpperCase();

  return (
    <li className={rowClass}>
      <Link to="/profile/$username" params={{ username: moderatedUser.username }} className="shrink-0">
        <FeedActorAvatar
          avatarUrl={avatarUrl}
          username={moderatedUser.username}
          initial={initial}
          className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden border settings-shell-border"
        />
      </Link>

      <Link
        to="/profile/$username"
        params={{ username: moderatedUser.username }}
        className="min-w-0 flex-1"
      >
        <p className="truncate text-sm font-semibold settings-shell-accent">
          {moderatedUser.displayUsername ?? moderatedUser.username}
        </p>
        <p className="truncate text-xs settings-shell-muted">@{moderatedUser.username}</p>
      </Link>

      {action === "unblock" ? (
        <UnblockButton username={moderatedUser.username} />
      ) : (
        <UnmuteButton username={moderatedUser.username} />
      )}
    </li>
  );
};

export const SettingsBlockedSection = () => {
  const blockedQuery = useBlockedUsers();
  const mutedQuery = useMutedUsers();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="border settings-shell-border settings-shell-panel">
        <div className="border-b px-5 py-4 settings-shell-row-border">
          <p className="mb-1 text-base font-bold text-foreground">Blocked Users</p>
          <p className="text-sm settings-shell-muted">
            Blocked users can't follow you, and their activity is hidden from your feed.
          </p>
        </div>

        {blockedQuery.isPending ? (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        ) : blockedQuery.isError ? (
          <p className="py-10 text-center text-sm settings-shell-muted">
            Could not load blocked users.
          </p>
        ) : blockedQuery.data.length === 0 ? (
          <p className="py-10 text-center text-sm settings-shell-muted">
            You haven't blocked anyone.
          </p>
        ) : (
          <ul>
            {blockedQuery.data.map((moderatedUser) => (
              <UserRow key={moderatedUser.id} moderatedUser={moderatedUser} action="unblock" />
            ))}
          </ul>
        )}
      </div>

      <div className="border settings-shell-border settings-shell-panel">
        <div className="border-b px-5 py-4 settings-shell-row-border">
          <p className="mb-1 text-base font-bold text-foreground">Muted Users</p>
          <p className="text-sm settings-shell-muted">
            Muted users don't know you've muted them. Their activity is hidden from your feed only.
          </p>
        </div>

        {mutedQuery.isPending ? (
          <div className="flex items-center justify-center py-10">
            <Spinner />
          </div>
        ) : mutedQuery.isError ? (
          <p className="py-10 text-center text-sm settings-shell-muted">
            Could not load muted users.
          </p>
        ) : mutedQuery.data.length === 0 ? (
          <p className="py-10 text-center text-sm settings-shell-muted">
            You haven't muted anyone.
          </p>
        ) : (
          <ul>
            {mutedQuery.data.map((moderatedUser) => (
              <UserRow key={moderatedUser.id} moderatedUser={moderatedUser} action="unmute" />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
