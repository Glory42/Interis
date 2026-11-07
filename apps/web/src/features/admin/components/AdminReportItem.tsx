import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import { useDismissReportTarget, useRemoveAndResolve } from "@/features/admin/hooks/useAdminReports";
import type { GroupedReport } from "@/features/admin/reports-api";
import { cn } from "@/lib/utils";

const HOUR_MS = 3_600_000;
const TYPE_LABEL: Record<GroupedReport["targetType"], string> = {
  review: "Review",
  post: "Post",
  comment: "Comment",
  post_comment: "Comment",
  list: "List",
};

// "1d 2h" since the item was first reported.
const ageSince = (date: Date) => {
  const hours = Math.max(0, Math.floor((Date.now() - date.getTime()) / HOUR_MS));
  return hours >= 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : hours > 0 ? `${hours}h` : "<1h";
};

export const AdminReportItem = ({ item, isPending }: { item: GroupedReport; isPending: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const removeMutation = useRemoveAndResolve();
  const dismissMutation = useDismissReportTarget();
  const isBusy = removeMutation.isPending || dismissMutation.isPending;
  const count = item.reportCount;

  return (
    <li className="border-b border-[color:var(--line)]">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="grid w-full grid-cols-[2rem_1fr_auto] items-baseline gap-3 py-2.5 text-left sm:grid-cols-[2rem_1fr_9rem_10rem_4rem]"
      >
        <span className="font-mono text-sm text-foreground">{count}</span>
        <span className="body-s min-w-0 truncate text-foreground">{`${TYPE_LABEL[item.targetType]} · ${item.contentSnapshot}`}</span>
        <span className="body-s hidden truncate text-muted-foreground sm:block">{item.authorUsername ? `@${item.authorUsername}` : "—"}</span>
        <span className="mono-meta hidden truncate uppercase text-muted-foreground sm:block">{item.reasons.join(" · ")}</span>
        <span className="mono-meta text-right text-muted-foreground">{ageSince(item.oldestReportAt)}</span>
      </button>

      {isOpen ? (
        <div className="space-y-3 pb-4 pl-11">
          <p className="body-s whitespace-pre-wrap text-foreground">{`“${item.contentSnapshot}”`}</p>
          <ul aria-label="Reports on this item" className="space-y-1">
            {item.reports.map((report, index) => (
              <li key={index} className="body-s text-muted-foreground">
                {`@${report.reporterUsername ?? "deleted"} · ${report.reason}${report.details ? ` “${report.details}”` : ""}`}
              </li>
            ))}
          </ul>
          {isPending ? (
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor={`note-${item.targetId}`} className="sr-only">Resolution note</label>
              <input
                id={`note-${item.targetId}`}
                value={note}
                maxLength={500}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Resolution note (saved to the audit log)…"
                className="body-s min-w-48 flex-1 rounded-[2px] border border-[color:var(--line)] bg-transparent px-2.5 py-1.5 text-foreground outline-none focus:border-[color:var(--primary)]"
              />
              <Button size="sm" variant="danger" disabled={isBusy} onClick={() => setIsConfirming(true)}>
                {`Remove & resolve ${count}`}
              </Button>
              <Button size="sm" variant="outline" disabled={isBusy} onClick={() => dismissMutation.mutate({ targetType: item.targetType, targetId: item.targetId, note })}>
                {`Dismiss ${count}`}
              </Button>
            </div>
          ) : null}
          {removeMutation.isError || dismissMutation.isError ? (
            <p role="alert" className={cn("body-s text-[color:var(--danger)]")}>That didn't go through. Try again.</p>
          ) : null}
        </div>
      ) : null}

      <AdminConfirmDialog
        isOpen={isConfirming}
        onClose={() => setIsConfirming(false)}
        title="Remove content"
        description={`Deletes this ${TYPE_LABEL[item.targetType].toLowerCase()}, closes all ${count} reports, and tells the author why.`}
        confirmLabel="Remove"
        variant="danger"
        isLoading={removeMutation.isPending}
        onConfirm={() =>
          removeMutation.mutate({ reportId: item.reportId, note }, { onSuccess: () => setIsConfirming(false) })
        }
      />
    </li>
  );
};
