import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AdminConfirmDialog } from "@/features/admin/components/AdminConfirmDialog";
import { AdminSuspendDialog } from "@/features/admin/components/AdminSuspendDialog";
import { useDismissReportTarget, useRemoveAndResolve } from "@/features/admin/hooks/useAdminReports";
import { REPORT_TYPE_LABEL as TYPE_LABEL, type GroupedReport } from "@/features/admin/reports-api";
import { cn } from "@/lib/utils";

// What an admin can do with one reported item; stacked in the phone sheet, inline on desktop.
export const AdminReportActions = ({ item, stacked = false, onDone }: { item: GroupedReport; stacked?: boolean; onDone?: () => void }) => {
  const [note, setNote] = useState("");
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuspending, setIsSuspending] = useState(false);
  const removeMutation = useRemoveAndResolve();
  const dismissMutation = useDismissReportTarget();
  const isBusy = removeMutation.isPending || dismissMutation.isPending;
  const count = item.reportCount;
  const author = item.authorUsername;
  const button = stacked ? "w-full justify-start" : undefined;

  return (
    <div className={cn("flex gap-2", stacked ? "flex-col" : "flex-wrap items-center")}>
      <label htmlFor={`note-${item.targetId}`} className="sr-only">Resolution note</label>
      <input
        id={`note-${item.targetId}`}
        value={note}
        maxLength={500}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Resolution note (saved to the audit log)…"
        className="body-s min-w-48 flex-1 rounded-[2px] border border-[color:var(--line)] bg-transparent px-2.5 py-1.5 text-base text-foreground outline-none focus:border-[color:var(--primary)] sm:text-sm"
      />
      <Button size="sm" variant="danger" className={button} disabled={isBusy} onClick={() => setIsConfirming(true)}>
        {`Remove & resolve ${count}`}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className={button}
        disabled={isBusy}
        onClick={() => dismissMutation.mutate({ targetType: item.targetType, targetId: item.targetId, note }, { onSuccess: onDone })}
      >
        {`Dismiss ${count}`}
      </Button>
      {author ? (
        <>
          <Button size="sm" variant="outline" className={button} onClick={() => setIsSuspending(true)}>
            {`Suspend @${author}…`}
          </Button>
          <Link to="/admin/users/$username" params={{ username: author }} className="body-s px-1 py-1.5 text-primary hover:underline">
            {`Open @${author}`}
          </Link>
        </>
      ) : null}
      {removeMutation.isError || dismissMutation.isError ? (
        <p role="alert" className="body-s text-[color:var(--danger)]">That didn't go through. Try again.</p>
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
          removeMutation.mutate(
            { reportId: item.reportId, note },
            {
              onSuccess: () => {
                setIsConfirming(false);
                onDone?.();
              },
            },
          )
        }
      />
      {isSuspending && author ? <AdminSuspendDialog username={author} onClose={() => setIsSuspending(false)} /> : null}
    </div>
  );
};
