import { FeedActivityCard } from "@/features/feed/components/FeedActivityCard";
import { inferFeedChannel } from "@/features/feed/components/feed-row.utils";
import type { FeedItem } from "@/features/feed/types";

export type FeedFilter = "all" | "cinema" | "serial";

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
      <div className="border-y border-border/60">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="animate-pulse border-b border-border/60 py-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 shrink-0 bg-muted/50" />
              <div className="flex flex-1 items-center gap-2">
                <div className="h-3 w-20 bg-muted/50" />
                <div className="h-3 w-14 bg-muted/30" />
                <div className="ml-auto h-3 w-10 bg-muted/30" />
              </div>
            </div>
            <div className="mt-3 ml-10">
              <div className="h-5 w-52 bg-muted/40" />
            </div>
            <div className="mt-3 ml-10 space-y-2">
              <div className="h-3 w-full bg-muted/25" />
              <div className="h-3 w-2/3 bg-muted/25" />
            </div>
            <div className="mt-3 ml-10 flex gap-5">
              <div className="h-3 w-8 bg-muted/30" />
              <div className="h-3 w-8 bg-muted/30" />
            </div>
          </div>
        ))}
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
