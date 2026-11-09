import { Link } from "@tanstack/react-router";
import { Rocket } from "lucide-react";
import type { MonthBar, RatingBucket, WeekCell } from "./stats-model";

const LEVEL_OPACITY = [0.1, 0.35, 0.55, 0.8, 1] as const;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// One cell per week this year; brightness is the number of logs.
export const WeekReel = ({ cells, year }: { cells: WeekCell[]; year: number }) => {
  const total = cells.reduce((sum, cell) => sum + cell.count, 0);
  return (
    <div
      role="img"
      aria-label={`${year} in reels: ${total} logs over ${cells.length} weeks`}
      className="grid grid-flow-col grid-rows-1 gap-[3px]"
      style={{ gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))` }}
    >
      {cells.map((cell) => (
        <i key={cell.week} className="h-4 rounded-[1px] bg-primary" style={{ opacity: LEVEL_OPACITY[cell.level] }} />
      ))}
    </div>
  );
};

// Vertical bars with their value on top; one hue, no grid.
export const MonthBars = ({ months }: { months: MonthBar[] }) => {
  const max = Math.max(1, ...months.map((month) => month.count));
  return (
    <div className="flex h-36 items-end gap-1.5">
      {months.map((month) => (
        <div key={month.key} className="flex flex-1 flex-col items-center gap-1" aria-label={`${MONTH_NAMES[Number(month.key.slice(5)) - 1]}: ${month.count} logs`}>
          <span aria-hidden className="mono-meta h-3 text-[9px] leading-3 text-muted-foreground">{month.count || ""}</span>
          <span aria-hidden className="w-full rounded-t-[1px] bg-primary" style={{ height: `${(month.count / max) * 96}px`, opacity: month.count ? 1 : 0.15, minHeight: 2 }} />
          <span aria-hidden className="mono-meta h-3 text-[9px] leading-3 text-muted-foreground">{month.label}</span>
        </div>
      ))}
    </div>
  );
};

export const RatingBars = ({ buckets }: { buckets: RatingBucket[] }) => {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
  return (
    <div className="flex h-36 items-end gap-[3px]">
      {buckets.map((bucket) => (
        <div key={bucket.rating} className="flex flex-1 flex-col items-center gap-1" aria-label={`${bucket.rating}: ${bucket.count} logs`}>
          <span aria-hidden className="mono-meta h-3 text-[8px] leading-3 text-muted-foreground">{bucket.count || ""}</span>
          <span aria-hidden className="w-full rounded-t-[1px] bg-primary" style={{ height: `${(bucket.count / max) * 96}px`, opacity: bucket.count ? 1 : 0.15, minHeight: 2 }} />
          <span aria-hidden className="mono-meta h-3 text-[8px] leading-3 text-muted-foreground">{Number.isInteger(bucket.rating) ? bucket.rating : ""}</span>
        </div>
      ))}
    </div>
  );
};

// Sits in the ratings header so both charts on the row start their bars at the same height.
export const AverageRating = ({ average }: { average: number }) => (
  <span className="mono-meta inline-flex shrink-0 items-center gap-1 text-[10px] text-primary">
    <Rocket aria-hidden className="size-3" />
    {`Avg ${average.toFixed(1)}`}
  </span>
);

type RankedRow = { label: string; count: number; slug?: string | null };

// Horizontal bars for top genres and directors.
export const RankedBars = ({ rows }: { rows: RankedRow[] }) => {
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <ul className="space-y-1.5">
      {rows.map((row) => (
        <li key={row.label} className="body-s">
          <div className="flex justify-between gap-2">
            {row.slug ? (
              <Link to="/director/$slug" params={{ slug: row.slug }} className="truncate text-foreground hover:underline" viewTransition>
                {row.label}
              </Link>
            ) : (
              <span className="truncate text-foreground">{row.label}</span>
            )}
            <span className="mono-meta text-muted-foreground">{row.count}</span>
          </div>
          <span aria-hidden className="mt-0.5 block h-1 rounded-[1px] bg-primary" style={{ width: `${(row.count / max) * 100}%` }} />
        </li>
      ))}
    </ul>
  );
};
