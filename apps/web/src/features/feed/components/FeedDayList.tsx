import { LoadingRegion, TitleRowsSkeleton } from "@/components/ui/PageSkeletons";
import { Skeleton } from "@/components/ui/Skeleton";
import { FeedRowView } from "@/features/feed/components/FeedRowView";
import type { FeedDay } from "@/features/feed/components/feed-days";

type FeedDayListProps = {
  isLoading: boolean;
  isError: boolean;
  days: FeedDay[];
};

// The feed as days: a slate line per day, then one card per watch and one row per folded run.
export const FeedDayList = ({ isLoading, isError, days }: FeedDayListProps) => {
  if (isLoading) {
    return (
      <LoadingRegion label="Loading feed" className="space-y-3">
        <Skeleton className="h-2.5 w-28 rounded-sm" />
        <TitleRowsSkeleton count={4} posterWidth="w-[62px]" bordered />
      </LoadingRegion>
    );
  }

  if (isError) {
    return <p className="body-s border-l-2 border-[color:var(--danger)]/50 pl-4 text-[color:var(--danger)]">Could not load your feed right now.</p>;
  }

  if (days.length === 0) {
    return <p className="body-s border-l-2 border-[color:var(--line)] pl-4 text-muted-foreground">Nothing here yet for this filter.</p>;
  }

  return (
    <div className="space-y-5">
      {days.map((day) => (
        <section key={day.key} aria-label={day.label}>
          <div className="slate mono-meta mb-2.5 uppercase">
            <span>{day.label}</span>
            <span>{day.week}</span>
          </div>
          <div className="space-y-2">
            {day.rows.map((row) => (
              <FeedRowView key={row.key} row={row} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
};
