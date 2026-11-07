import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ExistingLogSubject } from "@/features/media/log-editor/log-subject";
import { useDeleteLog } from "@/features/media/log-editor/use-log-mutations";

type DeleteLogConfirmProps = {
  subject: ExistingLogSubject;
  onClose: () => void;
  onDeleted: () => void;
};

// Asks before a log goes; its Review stays on the profile, unattached.
export const DeleteLogConfirm = ({ subject, onClose, onDeleted }: DeleteLogConfirmProps) => {
  const [unwatch, setUnwatch] = useState(false);
  const deleteLog = useDeleteLog();

  const handleConfirm = () => {
    deleteLog.mutate({ log: subject, unwatch }, { onSuccess: onDeleted });
  };

  return (
    <ConfirmDialog
      isOpen
      title="Delete this log?"
      description={
        subject.review ? "The review you wrote with it stays on your profile." : "This can't be undone."
      }
      confirmLabel="Delete"
      isDestructive
      isConfirming={deleteLog.isPending}
      onConfirm={handleConfirm}
      onClose={onClose}
      error={deleteLog.isError ? (deleteLog.error.message || "Could not delete log.") : null}
    >
      <label className="mt-3 flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={unwatch}
          onChange={(event) => setUnwatch(event.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 border-border bg-input accent-primary"
        />
        <span className="text-sm text-foreground">
          {subject.kind === "film" ? "Also mark as not watched" : "Also unmark the series and its episodes watched"}
          <span className="block text-xs text-muted-foreground">
            Only if this is your last log of it. Your like and rating stay.
          </span>
        </span>
      </label>
    </ConfirmDialog>
  );
};
