import { LoadingRegion, TitleRowsSkeleton } from "@/components/ui/PageSkeletons";
import { toFeedDays } from "@/features/feed/components/feed-days";
import { FeedRowView } from "@/features/feed/components/FeedRowView";
import type { FeedRow } from "@/features/feed/types";

type ProfileOverviewActivityProps = {
  rows: FeedRow[];
  isPending: boolean;
  isError: boolean;
};

// The profile's recent activity, one row per title per day under thin date lines.
export const ProfileOverviewActivity = ({ rows, isPending, isError }: ProfileOverviewActivityProps) => {
  if (isPending) {
    return (
      <LoadingRegion label="Loading activity">
        <TitleRowsSkeleton count={3} posterWidth="w-9" />
      </LoadingRegion>
    );
  }
  if (isError) return <p className="body-s text-[color:var(--danger)]">Could not load recent activity.</p>;
  if (rows.length === 0) return null;

  return (
    <section aria-label="Recent activity" className="space-y-4">
      {toFeedDays(rows).map((day, index) => (
        <div key={day.key}>
          <div className="mono-meta mb-2 flex items-center gap-2 uppercase text-muted-foreground">
            <span>{day.label}</span>
            <span aria-hidden className="h-px flex-1 bg-[color:var(--line)]" />
            {index === 0 ? <span>{day.week}</span> : null}
          </div>
          <div className="space-y-3">
            {day.rows.map((row) => (
              <FeedRowView key={row.key} row={row} variant="compact" />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
};
