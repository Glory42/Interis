import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import type { ReportItem, ReportStatus } from "@/features/admin/api";
import {
  useAdminReports,
  useDismissReport,
  useRemoveReportedContent,
  useResolveReport,
} from "@/features/admin/hooks/useAdmin";
import { formatRelativeTime } from "@/lib/time";

const STATUS_TABS: { value: ReportStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
];

const ReportRow = ({ report }: { report: ReportItem }) => {
  const resolveMutation = useResolveReport();
  const dismissMutation = useDismissReport();
  const removeMutation = useRemoveReportedContent();
  const isPending = resolveMutation.isPending || dismissMutation.isPending || removeMutation.isPending;
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);

  const handleRemove = async () => {
    await removeMutation.mutateAsync(report.id);
    setIsRemoveOpen(false);
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="muted">{report.targetType}</Badge>
            <Badge variant="muted">{report.reason}</Badge>
            <span className="text-xs text-muted-foreground">
              reported by @{report.reporterUsername} · {formatRelativeTime(report.createdAt.toISOString())}
            </span>
          </div>
          <Badge>{report.status}</Badge>
        </div>

        <p className="line-clamp-3 whitespace-pre-wrap text-sm text-foreground/90">
          {report.contentSnapshot}
        </p>

        {report.details ? (
          <p className="text-xs text-muted-foreground">Reporter note: {report.details}</p>
        ) : null}

        {report.status === "pending" ? (
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => dismissMutation.mutate(report.id)}
            >
              Dismiss
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => resolveMutation.mutate(report.id)}
            >
              Mark resolved
            </Button>
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={isPending}
              onClick={() => setIsRemoveOpen(true)}
            >
              Remove content
            </Button>
          </div>
        ) : null}

        <AdminConfirmDialog
          isOpen={isRemoveOpen}
          onClose={() => setIsRemoveOpen(false)}
          title="Remove content"
          description="This permanently deletes the reported content. This cannot be undone."
          confirmLabel="Remove"
          variant="danger"
          isLoading={removeMutation.isPending}
          onConfirm={() => void handleRemove()}
        />
      </CardContent>
    </Card>
  );
};

export const AdminReportsPanel = () => {
  const [status, setStatus] = useState<ReportStatus>("pending");
  const reportsQuery = useAdminReports(status);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={
              "border px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors " +
              (status === tab.value
                ? "border-primary/45 bg-primary/10 text-primary"
                : "border-border/70 text-muted-foreground hover:text-foreground")
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {reportsQuery.isPending ? (
        <div className="flex items-center justify-center py-10">
          <Spinner />
        </div>
      ) : reportsQuery.isError ? (
        <p className="text-sm text-muted-foreground">Could not load reports.</p>
      ) : reportsQuery.data.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {status} reports.</p>
      ) : (
        <div className="space-y-3">
          {reportsQuery.data.map((report) => (
            <ReportRow key={report.id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
};
