import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useUpdateReview } from "@/features/reviews/hooks/useReviews";

type FeedReviewEditDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  reviewId: string;
  initialContent: string;
  containsSpoilers: boolean;
};

export const FeedReviewEditDialog = ({
  isOpen,
  onClose,
  reviewId,
  initialContent,
  containsSpoilers,
}: FeedReviewEditDialogProps) => {
  const updateReviewMutation = useUpdateReview(reviewId);

  const [draftContent, setDraftContent] = useState(initialContent);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  const canSave =
    draftContent.trim().length > 0 &&
    draftContent.trim().length <= 10_000 &&
    !updateReviewMutation.isPending;

  const handleSave = async () => {
    if (!canSave) {
      return;
    }

    await updateReviewMutation.mutateAsync({
      content: draftContent.trim(),
      containsSpoilers,
    });
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="theme-modal-overlay fixed inset-0 z-140 bg-background/70 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close review edit dialog"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative mx-auto flex h-full w-full max-w-2xl items-start px-4 pt-16 sm:pt-20">
        <section className="theme-modal-panel relative w-full overflow-hidden border border-border/80 bg-card/95 p-0 animate-fade-up">
          <div className="flex items-start justify-between border-b border-border/70 px-4 py-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                EDIT REVIEW
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-7 w-7 items-center justify-center border border-border/70 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

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
                  className="border border-border/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
                >
                  cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void handleSave();
                  }}
                  disabled={!canSave}
                  className="border border-primary/45 bg-primary/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-primary disabled:cursor-not-allowed disabled:opacity-50"
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
      </div>
    </div>
  );
};
