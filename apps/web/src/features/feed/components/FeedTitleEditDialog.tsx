import { EditLogDialog } from "@/features/diary/components/EditLogDialog";
import { FeedReviewEditDialog } from "@/features/feed/components/FeedReviewEditDialog";
import type { FeedTitleGroup } from "@/features/feed/types";

type FeedTitleEditDialogProps = {
  group: FeedTitleGroup;
  onClose: () => void;
};

// Edit from a feed card: a log opens with its date, rewatch, rating and review;
// a review with no log in the group only edits its text.
export const FeedTitleEditDialog = ({ group, onClose }: FeedTitleEditDialogProps) => {
  const { log, movie, review } = group;

  if (log) {
    return (
      <EditLogDialog
        isOpen
        onClose={onClose}
        log={{
          ...log,
          mediaType: movie.mediaType === "tv" ? "tv" : "movie",
          tmdbId: movie.tmdbId,
          title: movie.title,
          hasReview: review !== null,
        }}
        review={review}
      />
    );
  }

  return review ? (
    <FeedReviewEditDialog
      isOpen
      onClose={onClose}
      reviewId={review.id}
      initialContent={review.content}
      containsSpoilers={review.containsSpoilers}
    />
  ) : null;
};
