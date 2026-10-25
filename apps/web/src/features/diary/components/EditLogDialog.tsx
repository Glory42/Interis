import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { CalendarPicker } from "@/components/ui/CalendarPicker";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalShell } from "@/components/ui/ModalShell";
import {
  useDeleteOwnLog,
  useUpdateOwnLog,
  type OwnLog,
} from "@/features/diary/hooks/useOwnLogActions";
import { SpaceRatingInput } from "@/features/movies/components/SpaceRating";
import { runDialogSubmit } from "@/lib/fire-and-forget";
import { todayAsLocalDateInput } from "@/lib/time";

export type EditableLog = OwnLog & {
  title: string;
  watchedDate: string;
  rating: number | null;
  rewatch: boolean;
  hasReview: boolean;
};

type EditLogDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  log: EditableLog;
};

export const EditLogDialog = ({ isOpen, ...rest }: EditLogDialogProps) => {
  // Keyed by log id so the draft starts fresh each time the dialog opens.
  return isOpen ? <EditLogDialogContent key={rest.log.id} {...rest} /> : null;
};

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const EditLogDialogContent = ({ onClose, log }: Omit<EditLogDialogProps, "isOpen">) => {
  const [watchedDate, setWatchedDate] = useState(log.watchedDate);
  const [rating, setRating] = useState(log.rating);
  const [rewatch, setRewatch] = useState(log.rewatch);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [unwatch, setUnwatch] = useState(false);
  const updateMutation = useUpdateOwnLog();
  const deleteMutation = useDeleteOwnLog();

  const input = {
    ...(watchedDate !== log.watchedDate && { watchedDate }),
    ...(rating !== log.rating && { rating }),
    ...(rewatch !== log.rewatch && { rewatch }),
  };
  const canSave = Object.keys(input).length > 0 && !updateMutation.isPending;

  const handleSave = () =>
    runDialogSubmit(async () => {
      if (!canSave) return;
      await updateMutation.mutateAsync({ log, input });
      onClose();
    });

  const handleDelete = () =>
    runDialogSubmit(async () => {
      await deleteMutation.mutateAsync({ log, unwatch });
      onClose();
    });

  return (
    <>
      <ModalShell onClose={onClose} containerClassName="max-w-md" ariaCloseLabel="Close edit log dialog">
        <section className="theme-modal-panel relative w-full overflow-hidden border border-border/80 bg-card/95 p-0 animate-fade-up">
          <ModalHeader title="EDIT LOG" onClose={onClose} closeAriaLabel="Close edit log dialog" align="start" />

          <div className="space-y-4 px-4 py-4">
            <p className="truncate text-sm font-semibold text-foreground">{log.title}</p>

            <CalendarPicker value={watchedDate} max={todayAsLocalDateInput()} onChange={setWatchedDate} />

            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border/70 bg-secondary/20 px-3 py-2.5 transition-colors hover:border-border">
              <input
                type="checkbox"
                checked={rewatch}
                onChange={(event) => setRewatch(event.target.checked)}
                className="h-4 w-4 shrink-0 border-border bg-input accent-primary"
              />
              <span className="text-sm font-medium text-foreground">I've watched this before</span>
            </label>

            <section className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Rating</p>
              <SpaceRatingInput value={rating} onChange={setRating} autoSave />
            </section>

            <div className="flex items-center justify-between gap-2 border-t border-border/60 pt-3">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-destructive/45 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="h-3 w-3" /> delete log
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-border/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                >
                  cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSave();
                  }}
                  disabled={!canSave}
                  className="rounded-full border border-primary/45 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-primary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {updateMutation.isPending ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> saving
                    </span>
                  ) : (
                    "save"
                  )}
                </button>
              </div>
            </div>

            {updateMutation.isError ? (
              <p className="font-mono text-[11px] text-destructive">
                {errorMessage(updateMutation.error, "Could not update log.")}
              </p>
            ) : null}
          </div>
        </section>
      </ModalShell>

      <ConfirmDialog
        isOpen={isConfirmingDelete}
        title="Delete this log?"
        description={
          log.hasReview
            ? "The review you wrote with it stays on your profile."
            : "This can't be undone."
        }
        confirmLabel="Delete"
        loadingLabel="Deleting"
        isDestructive
        isConfirming={deleteMutation.isPending}
        onConfirm={() => {
          void handleDelete();
        }}
        onClose={() => setIsConfirmingDelete(false)}
      >
        <label className="mt-3 flex cursor-pointer items-start gap-2.5">
          <input
            type="checkbox"
            checked={unwatch}
            onChange={(event) => setUnwatch(event.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 border-border bg-input accent-primary"
          />
          <span className="text-sm text-foreground">
            {log.mediaType === "movie"
              ? "Also mark as not watched"
              : "Also unmark the series and its episodes watched"}
            <span className="block text-xs text-muted-foreground">
              Only if this is your last log of it. Your like and rating stay.
            </span>
          </span>
        </label>
        {deleteMutation.isError ? (
          <p className="mt-2 text-xs text-destructive">
            {errorMessage(deleteMutation.error, "Could not delete log.")}
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
};
