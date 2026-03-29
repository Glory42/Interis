import { Spinner } from "@/components/ui/spinner";
import { FeedActivityCard } from "@/features/feed/components/FeedActivityCard";
import type { FeedItem } from "@/features/feed/types";

type FeedActivityListProps = {
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
  items: FeedItem[];
};

export const FeedActivityList = ({
  isAuthenticated,
  isLoading,
  isError,
  items,
}: FeedActivityListProps) => {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card/70 p-5 text-sm text-muted-foreground">
        <p className="flex items-center gap-2">
          <Spinner /> Loading your feed...
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
        Could not load your feed right now.
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card/70 p-5 text-sm text-muted-foreground">
        Sign in to unlock your feed.
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-border/70 bg-card/70 p-5 text-sm text-muted-foreground">
        No activity yet. Follow people or start posting, reviewing, and logging films.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <FeedActivityCard key={item.id} item={item} />
      ))}
    </div>
  );
};
