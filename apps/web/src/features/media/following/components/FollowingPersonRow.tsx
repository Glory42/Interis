import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { RocketDisplay } from "@/components/film/rating/RocketDisplay";
import { LikeMark } from "@/components/ui/LikeMark";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import type { MediaFollowingPerson } from "@/features/media/following/api";
import { toFollowingStatusLabel } from "@/features/media/following/following-labels";

type FollowingPersonRowProps = { person: MediaFollowingPerson };

// Memoized: rendered in a .map() beside the panel's open/closed state.
export const FollowingPersonRow = memo(function FollowingPersonRow({ person }: FollowingPersonRowProps) {
  const name = person.displayUsername ?? person.username;
  const profileLink = { to: "/profile/$username", params: { username: person.username } } as const;

  return (
    <li className="flex items-center gap-3 py-2.5">
      <Link {...profileLink} viewTransition aria-label={`${name}'s profile`}>
        <FeedActorAvatar
          avatarUrl={person.avatarUrl}
          username={person.username}
          initial={person.username.slice(0, 1).toUpperCase()}
          className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden border border-[color:var(--line-strong)] text-foreground"
        />
      </Link>
      <div className="min-w-0 flex-1">
        <Link {...profileLink} viewTransition className="user-text block truncate text-sm text-foreground hover:underline">
          {name}
        </Link>
        <p className="mono-meta truncate text-muted-foreground">{toFollowingStatusLabel(person)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {person.liked ? <LikeMark /> : null}
        {person.rating !== null ? <RocketDisplay rating={person.rating} variant="compact" size="sm" /> : null}
        {person.reviewId ? (
          <Link
            to="/reviews/$username/$reviewId"
            params={{ username: person.username, reviewId: person.reviewId }}
            viewTransition
            className="mono-meta text-muted-foreground underline underline-offset-2 hover:text-foreground"
          >
            Review
          </Link>
        ) : null}
      </div>
    </li>
  );
});
