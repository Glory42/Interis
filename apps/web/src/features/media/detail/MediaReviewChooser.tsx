import { useState } from "react";
import { FeedReviewEditDialog } from "@/features/feed/components/FeedReviewEditDialog";
import type { MyTitleReview } from "@/features/reviews/api";
import { ReviewChooserDialog } from "@/features/reviews/components/ReviewChooserDialog";
import type { ReviewChooser } from "@/features/reviews/hooks/useReviewChooser";

type MediaReviewChooserProps = {
  chooser: ReviewChooser;
  onReviewEdited: () => void;
};

// The movie/series Log button's chooser (#74): a review is written with a
// log, so "new" continues to the log form, and an existing review is edited
// on its own without touching the log it belongs to.
export const MediaReviewChooser = ({ chooser, onReviewEdited }: MediaReviewChooserProps) => {
  const [editingReview, setEditingReview] = useState<MyTitleReview | null>(null);

  return (
    <>
      <ReviewChooserDialog
        reviews={chooser.reviews}
        title="Your reviews"
        writeNewLabel="Log it again with a new review"
        onWriteNew={chooser.writeNew}
        onEdit={(review) => {
          chooser.close();
          setEditingReview(review);
        }}
        onClose={chooser.close}
      />
      <FeedReviewEditDialog
        isOpen={editingReview !== null}
        reviewId={editingReview?.id ?? ""}
        initialContent={editingReview?.content ?? ""}
        containsSpoilers={editingReview?.containsSpoilers ?? false}
        onSaved={onReviewEdited}
        onClose={() => setEditingReview(null)}
      />
    </>
  );
};
