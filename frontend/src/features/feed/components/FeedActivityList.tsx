import { Spinner } from "@/components/ui/spinner";
import { FeedActivityCard } from "@/features/feed/components/FeedActivityCard";
import { inferFeedChannel } from "@/features/feed/components/feed-row.utils";
import type { FeedItem } from "@/features/feed/types";

export type FeedFilter = "all" | "cinema" | "serial" | "codex" | "echoes";

type FeedActivityListProps = {
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
  items: FeedItem[];
  activeFilter: FeedFilter;
};

export const FeedActivityList = ({
  isAuthenticated,
  isLoading,
  isError,
  items,
  activeFilter,
}: FeedActivityListProps) => {
  if (isLoading) {
    return (
      <div className="border border-border/70 bg-card/70 px-4 py-4 font-mono text-xs text-muted-foreground">
        <p className="flex items-center gap-2">
          <Spinner /> loading feed stream...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="border border-destructive/45 bg-destructive/10 px-4 py-4 font-mono text-xs text-destructive">
        could not load feed stream.
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="border border-border/70 bg-card/70 px-4 py-4 font-mono text-xs text-muted-foreground">
        sign in to unlock your live feed.
      </div>
    );
  }

  const visibleItems =
    activeFilter === "all"
      ? items
      : items.filter((item) => inferFeedChannel(item) === activeFilter);

  if (visibleItems.length === 0) {
    return (
      <div className="border border-border/70 bg-card/70 px-4 py-4 font-mono text-xs text-muted-foreground">
        no entries for this filter yet.
      </div>
    );
  }

  return (
    <div className="border-y border-border/60">
      {visibleItems.map((item) => (
        <FeedActivityCard key={item.id} item={item} />
      ))}
    </div>
  );
};
