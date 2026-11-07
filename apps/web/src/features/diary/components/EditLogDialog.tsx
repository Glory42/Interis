import { useState } from "react";
import { Trash2 } from "lucide-react";
import { CalendarPicker } from "@/components/ui/CalendarPicker";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalShell } from "@/components/ui/ModalShell";
import {
  useDeleteOwnLog,
  useUpdateOwnLog,
  type OwnLog,
} from "@/features/diary/hooks/useOwnLogActions";
import { LaunchTrack } from "@/components/film/rating/LaunchTrack";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateReview } from "@/features/reviews/hooks/useReviews";
import { runDialogSubmit } from "@/lib/fire-and-forget";
import { todayAsLocalDateInput } from "@/lib/time";
import { TickLoader } from "@/components/ui/tick-loader";

export type EditableLog = OwnLog & {
  title: string;
  watchedDate: string;
  rating: number | null;
  rewatch: boolean;
  hasReview: boolean;
};

// The review written with the log, edited in the same dialog.
export type EditableLogReview = {
  id: string;
  content: string;
  containsSpoilers: boolean;
};

type EditLogDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  log: EditableLog;
  review?: EditableLogReview | null;
  onSaved?: () => void;
};

const REVIEW_MAX_LENGTH = 10_000;

export const EditLogDialog = ({ isOpen, ...rest }: EditLogDialogProps) => {
  // Keyed by log id so the draft starts fresh each time the dialog opens.
  return isOpen ? <EditLogDialogContent key={rest.log.id} {...rest} /> : null;
};

const errorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const EditLogDialogContent = ({
  onClose,
  log,
  review = null,
  onSaved,
}: Omit<EditLogDialogProps, "isOpen">) => {
  const [watchedDate, setWatchedDate] = useState(log.watchedDate);
  const [rating, setRating] = useState(log.rating);
  const [rewatch, setRewatch] = useState(log.rewatch);
  const [reviewContent, setReviewContent] = useState(review?.content ?? "");
  const [containsSpoilers, setContainsSpoilers] = useState(review?.containsSpoilers ?? false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [unwatch, setUnwatch] = useState(false);
  const updateMutation = useUpdateOwnLog();
  const updateReviewMutation = useUpdateReview(review?.id ?? "");
  const deleteMutation = useDeleteOwnLog();

  const input = {
    ...(watchedDate !== log.watchedDate && { watchedDate }),
    ...(rating !== log.rating && { rating }),
    ...(rewatch !== log.rewatch && { rewatch }),
  };
  const hasLogChanges = Object.keys(input).length > 0;
  const hasReviewChanges =
    review !== null &&
    (reviewContent.trim() !== review.content || containsSpoilers !== review.containsSpoilers);
  // A review can be reworded here but not emptied; deleting it lives on its own page.
  const isReviewValid = review === null || reviewContent.trim().length > 0;
  const isSaving = updateMutation.isPending || updateReviewMutation.isPending;
  const canSave = (hasLogChanges || hasReviewChanges) && isReviewValid && !isSaving;

  const handleSave = () =>
    runDialogSubmit(async () => {
      if (!canSave) return;
      await Promise.all([
        hasLogChanges ? updateMutation.mutateAsync({ log, input }) : null,
        hasReviewChanges
          ? updateReviewMutation.mutateAsync({ content: reviewContent.trim(), containsSpoilers })
          : null,
      ]);
      onSaved?.();
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
        <section className="theme-modal-panel relative flex max-h-[calc(100dvh-2rem)] w-full flex-col overflow-hidden border border-border/80 bg-card/95 p-0 animate-fade-up">
          <ModalHeader title={review ? "EDIT LOG & REVIEW" : "EDIT LOG"} onClose={onClose} closeAriaLabel="Close edit log dialog" align="start" />

          <div className="min-h-0 space-y-4 overflow-y-auto px-4 py-4">
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
              <LaunchTrack value={rating} onCommit={setRating} />
            </section>

            {review ? (
              <section className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Review</p>
                <Textarea
                  value={reviewContent}
                  maxLength={REVIEW_MAX_LENGTH}
                  onChange={(event) => setReviewContent(event.target.value)}
                  aria-label="Review"
                  className="max-h-[40dvh] min-h-28 border-border/75 bg-background/45 text-sm field-sizing-content"
                />
                <div className="flex items-center justify-between gap-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={containsSpoilers}
                      onChange={(event) => setContainsSpoilers(event.target.checked)}
                      className="h-4 w-4 shrink-0 border-border bg-input accent-primary"
                    />
                    <span className="text-sm text-foreground">Contains spoilers</span>
                  </label>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {`${reviewContent.length}/${REVIEW_MAX_LENGTH}`}
                  </span>
                </div>
              </section>
            ) : null}

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
                  {isSaving ? (
                    <span className="inline-flex items-center gap-1">
                      <TickLoader /> saving
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
            {updateReviewMutation.isError ? (
              <p className="font-mono text-[11px] text-destructive">
                {errorMessage(updateReviewMutation.error, "Could not update review.")}
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
