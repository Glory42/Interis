import { useState } from "react";
import { ChevronRight, PenLine, Plus } from "lucide-react";
import { ModalHeader } from "@/components/ui/ModalHeader";
import { ModalShell } from "@/components/ui/ModalShell";
import type { MyTitleReview } from "@/features/reviews/api";
import { formatRatingLabel } from "@/lib/rating";
import { formatDateLabel, formatDateOnlyLabel } from "@/lib/time";

type ReviewChooserDialogProps = {
  reviews: MyTitleReview[] | null;
  title: string;
  writeNewLabel: string;
  onWriteNew: () => void;
  onEdit: (review: MyTitleReview) => void;
  onClose: () => void;
};

const PREVIEW_LENGTH = 140;

// A review belongs to the log it was written with, so it's dated by that
// watch; season/episode reviews have no log and use their creation date.
const reviewDateLabel = (review: MyTitleReview): string =>
  review.watchedDate
    ? formatDateOnlyLabel(review.watchedDate)
    : formatDateLabel(review.createdAt);

const reviewPreview = (content: string): string =>
  content.length > PREVIEW_LENGTH ? `${content.slice(0, PREVIEW_LENGTH).trimEnd()}…` : content;

const optionClassName =
  "flex w-full items-center gap-3 rounded-lg border border-border/70 bg-background/40 px-3 py-2.5 text-left transition-colors hover:border-primary/45 hover:bg-primary/5";

export const ReviewChooserDialog = ({ reviews, ...rest }: ReviewChooserDialogProps) => {
  // Mounted only while open, so the picker step resets on every open.
  return reviews && reviews.length > 0 ? (
    <ReviewChooserDialogContent reviews={reviews} {...rest} />
  ) : null;
};

const ReviewChooserDialogContent = ({
  reviews,
  title,
  writeNewLabel,
  onWriteNew,
  onEdit,
  onClose,
}: Omit<ReviewChooserDialogProps, "reviews"> & { reviews: MyTitleReview[] }) => {
  const [isPicking, setIsPicking] = useState(false);
  const [onlyReview] = reviews.length === 1 ? reviews : [];

  return (
    <ModalShell onClose={onClose} containerClassName="max-w-md" ariaCloseLabel="Close review chooser">
      <section className="theme-modal-panel relative w-full overflow-hidden border border-border/80 bg-card/95 p-0 animate-fade-up">
        <ModalHeader
          title={isPicking ? "Pick a review to edit" : title}
          onClose={onClose}
          closeAriaLabel="Close review chooser"
        />

        {isPicking ? (
          <ul className="max-h-[60vh] space-y-2 overflow-y-auto px-4 py-4">
            {reviews.map((review) => {
              const ratingLabel = formatRatingLabel(review.rating);
              return (
                <li key={review.id}>
                  <button type="button" className={optionClassName} onClick={() => onEdit(review)}>
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                        <span>{reviewDateLabel(review)}</span>
                        {ratingLabel ? <span className="text-foreground">{ratingLabel}</span> : null}
                      </span>
                      <span className="block text-sm text-foreground">{reviewPreview(review.content)}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="space-y-2 px-4 py-4">
            <button type="button" className={optionClassName} onClick={onWriteNew}>
              <Plus className="h-4 w-4 shrink-0 text-primary" />
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-foreground">
                {writeNewLabel}
              </span>
            </button>
            <button
              type="button"
              className={optionClassName}
              onClick={() => (onlyReview ? onEdit(onlyReview) : setIsPicking(true))}
            >
              <PenLine className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="font-mono text-xs uppercase tracking-[0.12em] text-foreground">
                {onlyReview
                  ? `Edit your review from ${reviewDateLabel(onlyReview)}`
                  : `Edit an existing review (${reviews.length})`}
              </span>
            </button>
          </div>
        )}
      </section>
    </ModalShell>
  );
};
