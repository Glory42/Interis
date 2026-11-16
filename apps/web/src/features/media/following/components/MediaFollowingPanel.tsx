import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { RocketDisplay } from "@/components/film/rating/RocketDisplay";
import { FeedActorAvatar } from "@/features/feed/components/FeedActorAvatar";
import type { MediaKind } from "@/features/media/media-cache";
import { FollowingPersonRow } from "@/features/media/following/components/FollowingPersonRow";
import { roundAverage, toFollowingSummaryLabel } from "@/features/media/following/following-labels";
import { useMediaFollowing } from "@/features/media/following/hooks/useMediaFollowing";
import { cn } from "@/lib/utils";

const STACKED_AVATARS = 5;

type MediaFollowingPanelProps = { kind: MediaKind; tmdbId: number };

// "From people you follow": a one-line summary that opens into the list.
// Renders nothing signed out, while loading, or when no followee has seen it.
export const MediaFollowingPanel = ({ kind, tmdbId }: MediaFollowingPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data } = useMediaFollowing(kind, tmdbId);

  if (!data || data.summary.count === 0) return null;

  const { summary, people } = data;
  const hiddenCount = summary.count - people.length;

  return (
    <section aria-label="From people you follow" className="mb-8 border-y border-[color:var(--line)] py-3">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        className="flex w-full items-center gap-3 text-left"
      >
        <span aria-hidden className="flex shrink-0">
          {people.slice(0, STACKED_AVATARS).map((person, index) => (
            <FeedActorAvatar
              key={person.username}
              avatarUrl={person.avatarUrl}
              username={person.username}
              initial={person.username.slice(0, 1).toUpperCase()}
              className={cn(
                "flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden border-2 border-background bg-card text-foreground",
                index > 0 && "-ml-2",
              )}
            />
          ))}
        </span>
        <span className="mono-meta flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 text-muted-foreground">
          <span className="text-foreground">{toFollowingSummaryLabel(kind, summary.count)}</span>
          {summary.averageRating !== null ? (
            <>
              <span aria-hidden>·</span>
              <span>avg</span>
              <RocketDisplay rating={roundAverage(summary.averageRating)} variant="compact" size="sm" />
            </>
          ) : null}
        </span>
        <ChevronDown
          aria-hidden
          className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen ? (
        <ul className="mt-2 divide-y divide-[color:var(--line)]">
          {people.map((person) => (
            <FollowingPersonRow key={person.username} person={person} />
          ))}
        </ul>
      ) : null}
      {isOpen && hiddenCount > 0 ? (
        <p className="mono-meta pt-2 text-muted-foreground">+ {hiddenCount} more</p>
      ) : null}
    </section>
  );
};
