import type { ReportStatus } from "@/features/admin/api";
import { AdminPanelState } from "@/features/admin/components/AdminPanelState";
import { AdminReportItem } from "@/features/admin/components/AdminReportItem";
import { useGroupedReports } from "@/features/admin/hooks/useAdminReports";
import { PHONE_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

const STATUSES: ReportStatus[] = ["pending", "resolved", "dismissed"];

// One row per reported item, most-reported and oldest first.
export const AdminReportsPanel = ({ status, onStatusChange }: { status: ReportStatus; onStatusChange: (status: ReportStatus) => void }) => {
  const query = useGroupedReports(status);
  const isPhone = useMediaQuery(PHONE_QUERY);
  const items = query.data ?? [];
  const reportCount = items.reduce((total, item) => total + item.reportCount, 0);

  return (
    <div className={cn(isPhone && "pb-16")}>
      <div
        role="toolbar"
        aria-label="Report status"
        className={cn(
          "mono-meta flex items-center gap-4 uppercase",
          isPhone ? "fixed inset-x-0 bottom-0 z-40 border-t border-[color:var(--line)] bg-background/95 px-4 py-3 backdrop-blur" : "mb-3",
        )}
      >
        {STATUSES.map((candidate) => (
          <button
            key={candidate}
            type="button"
            aria-pressed={status === candidate}
            onClick={() => onStatusChange(candidate)}
            className={cn(status === candidate ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {candidate}
          </button>
        ))}
        <button type="button" disabled={query.isFetching} onClick={() => void query.refetch()} className="ml-auto text-muted-foreground hover:text-foreground disabled:opacity-50">
          ↻ Refresh
        </button>
      </div>

      <AdminPanelState query={query} emptyMessage={`No ${status} reports.`}>
        {(rows) => (
          <ul className="border-t border-[color:var(--line)]">
            {rows.map((item) => (
              <AdminReportItem key={`${item.targetType}-${item.targetId}`} item={item} isPending={status === "pending"} />
            ))}
          </ul>
        )}
      </AdminPanelState>

      {items.length > 0 ? (
        <p className="mono-meta mt-3 uppercase text-muted-foreground">
          {`${items.length} item${items.length === 1 ? "" : "s"} · ${reportCount} report${reportCount === 1 ? "" : "s"}`}
        </p>
      ) : null}
    </div>
  );
};
