import { useState } from "react";
import { EditLogDialog } from "@/features/diary/components/EditLogDialog";
import { FeedReviewEditDialog } from "@/features/feed/components/FeedReviewEditDialog";
import type { MyTitleReview } from "@/features/reviews/api";
import { ReviewChooserDialog } from "@/features/reviews/components/ReviewChooserDialog";
import type { ReviewChooser } from "@/features/reviews/hooks/useReviewChooser";

type MediaReviewChooserProps = {
  chooser: ReviewChooser;
  title: { mediaType: "movie" | "tv"; tmdbId: number; title: string };
};

// The movie/series Log button's chooser (#74): a review is written with a
// log, so "new" continues to the log form, and an existing review is edited
// together with its log (date, rewatch, rating); a review without a log only
// edits its text.
export const MediaReviewChooser = ({ chooser, title }: MediaReviewChooserProps) => {
  const [editingReview, setEditingReview] = useState<MyTitleReview | null>(null);
  const logId = editingReview?.diaryEntryId ?? null;
  const watchedDate = editingReview?.watchedDate ?? null;
  const close = () => setEditingReview(null);

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
      {editingReview && logId && watchedDate ? (
        <EditLogDialog
          isOpen
          log={{
            id: logId,
            mediaType: title.mediaType,
            tmdbId: title.tmdbId,
            title: title.title,
            watchedDate,
            rating: editingReview.rating,
            rewatch: editingReview.rewatch ?? false,
            hasReview: true,
          }}
          review={editingReview}
          onClose={close}
        />
      ) : (
        <FeedReviewEditDialog
          isOpen={editingReview !== null}
          reviewId={editingReview?.id ?? ""}
          initialContent={editingReview?.content ?? ""}
          containsSpoilers={editingReview?.containsSpoilers ?? false}
          onClose={close}
        />
      )}
    </>
  );
};
