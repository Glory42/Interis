import { memo, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import { LineRowsSkeleton, LoadingRegion } from "@/components/ui/PageSkeletons";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import type { FollowSuggestion } from "@/features/social/api";
import { FollowToggleButton } from "@/features/social/components/FollowToggleButton";
import { formatSuggestionReason } from "@/features/social/follow-suggestion-reason";
import { useFollowSuggestions } from "@/features/social/hooks/useFollowSuggestions";
import { useFollowToggle, type FollowToggleVariables } from "@/features/social/hooks/useSocial";
import { useViewerFollows } from "@/features/social/hooks/useViewerFollows";
import { cn } from "@/lib/utils";

type FollowSuggestionRowProps = {
  suggestion: FollowSuggestion;
  followStatus: "following" | "not-following" | "loading";
  isTogglePending: boolean;
  onToggleFollow: (variables: FollowToggleVariables) => void;
};

const FollowSuggestionRowBase = ({
  suggestion,
  followStatus,
  isTogglePending,
  onToggleFollow,
}: FollowSuggestionRowProps) => (
  <li className="flex items-center gap-3 border-b border-[color:var(--line)] py-3 last:border-0">
    <Link to="/profile/$username" params={{ username: suggestion.username }} className="shrink-0">
      <FeedActorAvatar
        avatarUrl={suggestion.avatarUrl}
        username={suggestion.username}
        initial={suggestion.username.slice(0, 1).toUpperCase()}
        className="flex size-10 shrink-0 items-center justify-center overflow-hidden border border-[color:var(--line-strong)] bg-card font-mono text-sm text-muted-foreground"
      />
    </Link>
    <div className="min-w-0 flex-1">
      <Link
        to="/profile/$username"
        params={{ username: suggestion.username }}
        className="block truncate text-sm font-semibold text-foreground hover:text-primary"
      >
        {suggestion.displayUsername ?? suggestion.username}
      </Link>
      <p className="truncate text-xs text-muted-foreground">{formatSuggestionReason(suggestion)}</p>
    </div>
    {followStatus === "loading" ? (
      <span aria-hidden className="h-9 w-22 shrink-0 animate-pulse rounded-md bg-muted/30 sm:h-7" />
    ) : (
      <FollowToggleButton
        username={suggestion.username}
        isFollowing={followStatus === "following"}
        isPending={isTogglePending}
        onToggle={() =>
          onToggleFollow({
            userId: suggestion.id,
            username: suggestion.username,
            follow: followStatus !== "following",
          })
        }
      />
    )}
  </li>
);

// Following one row re-renders only that row.
const FollowSuggestionRow = memo(FollowSuggestionRowBase);

type FollowSuggestionListProps = {
  limit: number;
  emptyText?: string;
  className?: string;
};

// People to follow by taste overlap, used by onboarding and the empty feed.
export const FollowSuggestionList = ({
  limit,
  emptyText = "No one to suggest yet. Check back once more people join.",
  className,
}: FollowSuggestionListProps) => {
  const query = useFollowSuggestions(limit);
  const followToggle = useFollowToggle();
  const userIds = useMemo(() => (query.data ?? []).map((suggestion) => suggestion.id), [query.data]);
  const { followedIds, isLoaded } = useViewerFollows(userIds, userIds.length > 0);

  if (query.isPending) {
    return (
      <LoadingRegion label="Loading people to follow" className={className}>
        <LineRowsSkeleton count={4} />
      </LoadingRegion>
    );
  }

  if (query.isError) {
    return <p className={cn("body-s text-muted-foreground", className)}>Could not load suggestions right now.</p>;
  }

  if (query.data.length === 0) {
    return <p className={cn("body-s text-muted-foreground", className)}>{emptyText}</p>;
  }

  const pendingToggleId = followToggle.isPending ? followToggle.variables?.userId : undefined;

  return (
    <ul className={className}>
      {query.data.map((suggestion) => (
        <FollowSuggestionRow
          key={suggestion.id}
          suggestion={suggestion}
          followStatus={!isLoaded ? "loading" : followedIds.has(suggestion.id) ? "following" : "not-following"}
          isTogglePending={pendingToggleId === suggestion.id}
          onToggleFollow={followToggle.mutate}
        />
      ))}
    </ul>
  );
};
