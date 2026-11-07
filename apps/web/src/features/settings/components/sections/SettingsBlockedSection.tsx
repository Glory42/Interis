import { LineRowsSkeleton, LoadingRegion } from "@/components/ui/PageSkeletons";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { SentenceSelect } from "@/components/ui/SentenceSelect";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import type { ModeratedUser } from "@/features/moderation/api";
import {
  useBlockedUsers,
  useMutedUsers,
  useUnblockUser,
  useUnmuteUser,
} from "@/features/moderation/hooks/useModeration";

const UnblockButton = ({ username }: { username: string }) => {
  const unblockMutation = useUnblockUser(username);

  return (
    <button
      type="button"
      disabled={unblockMutation.isPending}
      onClick={() => unblockMutation.mutate()}
      className="body-s shrink-0 rounded-[3px] border border-[color:var(--line)] px-2.5 py-1 text-foreground hover:border-[color:var(--line-strong)] disabled:cursor-not-allowed disabled:opacity-50"
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
      className="body-s shrink-0 rounded-[3px] border border-[color:var(--line)] px-2.5 py-1 text-foreground hover:border-[color:var(--line-strong)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {unmuteMutation.isPending ? "Saving" : "Unmute"}
    </button>
  );
};

const formatDay = (date: Date) => date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

const UserRow = ({ moderatedUser, action }: { moderatedUser: ModeratedUser; action: "unblock" | "unmute" }) => (
  <li className="flex items-center gap-3 border-b border-[color:var(--line)] py-2.5">
    <Link to="/profile/$username" params={{ username: moderatedUser.username }} className="shrink-0">
      <FeedActorAvatar
        avatarUrl={moderatedUser.avatarUrl ?? null}
        username={moderatedUser.username}
        initial={moderatedUser.username.slice(0, 1).toUpperCase()}
        className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[3px]"
      />
    </Link>
    <Link to="/profile/$username" params={{ username: moderatedUser.username }} className="body min-w-0 flex-1 truncate text-foreground">
      {`@${moderatedUser.username}`}
    </Link>
    <span className="mono-meta shrink-0 uppercase text-muted-foreground">
      {`${action === "unblock" ? "Blocked" : "Muted"} ${formatDay(moderatedUser.createdAt)}`}
    </span>
    {action === "unblock" ? <UnblockButton username={moderatedUser.username} /> : <UnmuteButton username={moderatedUser.username} />}
  </li>
);

const LoadMoreRow = ({
  label,
  isLoading,
  onLoadMore,
}: {
  label: string;
  isLoading: boolean;
  onLoadMore: () => void;
}) => (
  <div className="flex justify-center px-5 py-3">
    <button
      type="button"
      aria-label={label}
      disabled={isLoading}
      onClick={onLoadMore}
      className="body-s text-muted-foreground underline-offset-4 hover:underline disabled:opacity-60"
    >
      {isLoading ? "Loading…" : "Load more"}
    </button>
  </div>
);

type ListKind = "blocked" | "muted";

const EXPLAINER: Record<ListKind, string> = {
  blocked: "Blocked people can't follow you and don't appear in your feed.",
  muted: "Muted people don't know they're muted. Their activity is hidden from your feed only.",
};

export const SettingsBlockedSection = () => {
  const blockedQuery = useBlockedUsers();
  const mutedQuery = useMutedUsers();
  const [kind, setKind] = useState<ListKind>("blocked");

  const countOf = (query: typeof blockedQuery) => `${query.data?.length ?? 0}${query.hasNextPage ? "+" : ""}`;
  const counts = { blocked: countOf(blockedQuery), muted: countOf(mutedQuery) };
  const options = (["blocked", "muted"] as const).map((value) => ({
    value,
    word: `${value} (${counts[value]})`,
    label: `${value === "blocked" ? "Blocked" : "Muted"} (${counts[value]})`,
  }));
  const other: ListKind = kind === "blocked" ? "muted" : "blocked";
  const query = kind === "blocked" ? blockedQuery : mutedQuery;

  return (
    <section>
      <h2 className="display-4 text-foreground">Blocked &amp; muted</h2>
      <p className="body-s mt-1 text-muted-foreground">
        {"Showing "}
        <SentenceSelect value={kind} options={options} onChange={setKind} />
        {` · ${other} (${counts[other]})`}
      </p>

      {query.isPending ? (
        <LoadingRegion label={`Loading ${kind} users`}>
          <LineRowsSkeleton count={3} />
        </LoadingRegion>
      ) : query.isError ? (
        <p className="body-s py-6 text-muted-foreground">{`Could not load ${kind} users.`}</p>
      ) : query.data.length === 0 ? (
        <p className="body-s py-6 text-muted-foreground">{kind === "blocked" ? "You haven't blocked anyone." : "You haven't muted anyone."}</p>
      ) : (
        <ul className="mt-3 border-t border-[color:var(--line)]">
          {query.data.map((moderatedUser) => (
            <UserRow key={moderatedUser.id} moderatedUser={moderatedUser} action={kind === "blocked" ? "unblock" : "unmute"} />
          ))}
        </ul>
      )}
      {query.hasNextPage ? (
        <LoadMoreRow
          label={`Load more ${kind} users`}
          isLoading={query.isFetchingNextPage}
          onLoadMore={() => void query.fetchNextPage()}
        />
      ) : null}

      <p className="body-s mt-3 text-muted-foreground">{EXPLAINER[kind]}</p>
    </section>
  );
};
