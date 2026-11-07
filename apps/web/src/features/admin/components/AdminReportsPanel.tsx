import type { ReportStatus } from "@/features/admin/api";
import { AdminPanelState } from "@/features/admin/components/AdminPanelState";
import { AdminReportItem } from "@/features/admin/components/AdminReportItem";
import { useGroupedReports } from "@/features/admin/hooks/useAdminReports";
import { cn } from "@/lib/utils";

const STATUSES: ReportStatus[] = ["pending", "resolved", "dismissed"];

// One row per reported item, most-reported and oldest first.
export const AdminReportsPanel = ({ status, onStatusChange }: { status: ReportStatus; onStatusChange: (status: ReportStatus) => void }) => {
  const query = useGroupedReports(status);
  const items = query.data ?? [];
  const reportCount = items.reduce((total, item) => total + item.reportCount, 0);

  return (
    <div>
      <div className="mono-meta mb-3 flex gap-4 uppercase">
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
