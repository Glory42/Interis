import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { TickLoader } from "@/components/ui/tick-loader";
import { useAdminOverview } from "@/features/admin/hooks/useAdmin";

const HOUR_MS = 3_600_000;
const n = (value: number) => value.toLocaleString("en-US");

// "3d 4h" between the oldest pending report and when the counts were taken.
const ageOf = (from: Date, to: Date) => {
  const hours = Math.max(0, Math.floor((to.getTime() - from.getTime()) / HOUR_MS));
  return hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h`;
};

const timeOf = (date: Date) => date.toTimeString().slice(0, 5);

const Credit = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-baseline gap-2 py-1">
    <span className="body-s text-foreground">{label}</span>
    <span aria-hidden className="min-w-3 flex-1 -translate-y-1 border-b border-dotted border-[color:var(--line-strong)]" />
    <span className="font-mono text-sm text-foreground">{children}</span>
  </div>
);

export const AdminOverviewPage = () => {
  const { data, isPending, isError, refetch, isFetching } = useAdminOverview();

  if (isPending) {
    return (
      <p className="body-s flex items-center gap-2 text-muted-foreground">
        <TickLoader /> Counting…
      </p>
    );
  }
  if (isError) return <p className="body-s text-[color:var(--danger)]">Could not load the overview.</p>;

  const { needsYou, lastSevenDays, cache, latestActions, computedAt } = data;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div>
        <div className="mono-meta mb-3 flex items-center justify-between uppercase text-muted-foreground">
          <span>{`Computed ${timeOf(computedAt)}`}</span>
          <button type="button" disabled={isFetching} onClick={() => void refetch()} className="hover:text-foreground disabled:opacity-50">
            ↻ Refresh
          </button>
        </div>
        <h2 className="kicker mb-1 text-primary">Needs you</h2>
        <Credit label="Pending reports">
          {needsYou.oldestPendingAt ? `${needsYou.pendingReports} · oldest ${ageOf(needsYou.oldestPendingAt, computedAt)}` : needsYou.pendingReports}
        </Credit>
        <Credit label="Reported items">{needsYou.reportedItems}</Credit>
        <Credit label="Suspensions ending ≤ 7d">{needsYou.suspensionsEndingSoon}</Credit>

        <h2 className="kicker mt-5 mb-1 text-muted-foreground">Last 7 days</h2>
        <Credit label="New accounts">{n(lastSevenDays.newAccounts)}</Credit>
        <Credit label="Diary entries">{n(lastSevenDays.diaryEntries)}</Credit>
        <Credit label="Reviews">{n(lastSevenDays.reviews)}</Credit>
        <Credit label="Posts · comments">{`${n(lastSevenDays.posts)} · ${n(lastSevenDays.comments)}`}</Credit>
        <Credit label="Cached films · series">{`${n(cache.films)} · ${n(cache.series)}`}</Credit>
      </div>

      <div>
        <h2 className="kicker mb-2 text-muted-foreground">Latest admin actions</h2>
        {latestActions.length === 0 ? (
          <p className="body-s text-muted-foreground">Nothing yet.</p>
        ) : (
          <ul>
            {latestActions.map((entry) => (
              <li key={`${entry.createdAt.toISOString()}-${entry.action}`} className="body-s flex gap-2 border-b border-[color:var(--line)] py-1.5">
                <span className="font-mono text-muted-foreground">{timeOf(entry.createdAt)}</span>
                <span className="min-w-0 truncate text-foreground">
                  {`${entry.action}${entry.targetLabel ? ` ${entry.targetLabel}` : ""}`}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Link to="/admin/reports" className="body-s mt-3 inline-block text-primary hover:underline">
          Open the report queue →
        </Link>
      </div>
    </div>
  );
};
