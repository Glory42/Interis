import { FeedActivityCard } from "@/features/feed/components/FeedActivityCard";
import type { FeedItem } from "@/features/feed/types";
import { cn } from "@/lib/utils";

export type FeedFilter = "all" | "cinema" | "serial";

type FeedActivityListProps = {
  isAuthenticated: boolean;
  isLoading: boolean;
  isError: boolean;
  items: FeedItem[];
};

const formatDayLabel = (value: string): string => {
  const date = new Date(value);
  const now = new Date();
  const startOfDay = (input: Date) =>
    new Date(input.getFullYear(), input.getMonth(), input.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: date.getFullYear() === now.getFullYear() ? undefined : "numeric",
  });
};

const FeedSkeletonRow = () => (
  <div className="flex animate-pulse gap-4 py-6 first:pt-0">
    <div className="h-28 w-[76px] shrink-0 bg-muted/40" />
    <div className="min-w-0 flex-1 space-y-3 pt-1">
      <div className="flex items-center gap-2">
        <div className="h-3 w-24 bg-muted/40" />
        <div className="ml-auto h-3 w-10 bg-muted/25" />
      </div>
      <div className="h-4 w-48 bg-muted/35" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-muted/20" />
        <div className="h-3 w-2/3 bg-muted/20" />
      </div>
    </div>
  </div>
);

export const FeedActivityList = ({
  isAuthenticated,
  isLoading,
  isError,
  items,
}: FeedActivityListProps) => {
  if (isLoading) {
    return (
      <div className="divide-y divide-border/30">
        {Array.from({ length: 4 }).map((_, i) => (
          <FeedSkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <p className="border-l-2 border-destructive/50 pl-4 text-sm text-destructive">
        Could not load your feed right now.
      </p>
    );
  }

  if (!isAuthenticated) {
    return (
      <p className="border-l-2 border-border/60 pl-4 text-sm text-muted-foreground">
        Sign in to see activity from people you follow.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="border-l-2 border-border/60 pl-4 text-sm text-muted-foreground">
        Nothing here yet for this filter.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border/40">
      {items.map((item, index) => {
        const dayLabel = formatDayLabel(item.createdAt);
        const previousDayLabel =
          index > 0 ? formatDayLabel(items[index - 1].createdAt) : null;

        return (
          <div key={item.id}>
            {dayLabel !== previousDayLabel ? (
              <p
                className={cn(
                  "theme-kicker mb-1.5 text-[9px] text-muted-foreground/70",
                  index === 0 ? "mt-0" : "mt-6",
                )}
              >
                {dayLabel}
              </p>
            ) : null}
            <FeedActivityCard item={item} />
          </div>
        );
      })}
    </div>
  );
};
