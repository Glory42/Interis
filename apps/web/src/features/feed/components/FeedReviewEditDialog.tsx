import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalShell } from "@/components/ui/ModalShell";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateReview } from "@/features/reviews/hooks/useReviews";
import { runDialogSubmit } from "@/lib/fire-and-forget";

type FeedReviewEditDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  initialContent: string;
  containsSpoilers: boolean;
};

export const FeedReviewEditDialog = ({ isOpen, ...rest }: FeedReviewEditDialogProps) => {
  // Keying by reviewId remounts the dialog fresh each time it opens (or
  // when it opens for a different review), so draft state naturally
  // resets without an effect syncing it from props.
  return isOpen ? <FeedReviewEditDialogContent key={rest.reviewId} {...rest} /> : null;
};

type FeedReviewEditDialogContentProps = Omit<FeedReviewEditDialogProps, "isOpen">;

const FeedReviewEditDialogContent = ({
  onClose,
  reviewId,
  initialContent,
  containsSpoilers,
}: FeedReviewEditDialogContentProps) => {
  const [draftContent, setDraftContent] = useState(initialContent);
  const updateReviewMutation = useUpdateReview(reviewId);

  const canSave =
    draftContent.trim().length > 0 &&
    draftContent.trim().length <= 10_000 &&
    draftContent !== initialContent &&
    !updateReviewMutation.isPending;

  const handleSave = () =>
    runDialogSubmit(async () => {
      if (!canSave) {
        return;
      }

      await updateReviewMutation.mutateAsync({
        content: draftContent.trim(),
        containsSpoilers,
      });
      onClose();
    });

  return (
    <ModalShell onClose={onClose} containerClassName="max-w-2xl" ariaCloseLabel="Close review edit dialog">
      <section className="theme-modal-panel relative w-full overflow-hidden border border-border/80 bg-card/95 p-0 animate-fade-up">
        <ModalHeader title="EDIT REVIEW" onClose={onClose} closeAriaLabel="Close edit review dialog" align="start" />

        <div className="space-y-3 px-4 py-4">
            <Textarea
              value={draftContent}
              onChange={(event) => {
                if (event.target.value.length <= 10_000) {
                  setDraftContent(event.target.value);
                }
              }}
              className="min-h-32 border-border/75 bg-background/45 font-mono text-sm"
            />

            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] text-muted-foreground">
                {draftContent.length}/10000
              </span>
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
                  {updateReviewMutation.isPending ? (
                    <span className="inline-flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" /> saving
                    </span>
                  ) : (
                    "save"
                  )}
                </button>
              </div>
            </div>

            {updateReviewMutation.isError ? (
              <p className="font-mono text-[11px] text-destructive">
                {updateReviewMutation.error instanceof Error
                  ? updateReviewMutation.error.message
                  : "Could not update review."}
              </p>
            ) : null}
        </div>
      </section>
    </ModalShell>
  );
};
