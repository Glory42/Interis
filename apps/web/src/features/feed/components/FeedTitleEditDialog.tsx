import { FeedReviewEditDialog } from "@/features/feed/components/FeedReviewEditDialog";
import type { FeedTitleGroup } from "@/features/feed/types";
import { LogEditor } from "@/features/media/log-editor/LogEditor";
import { toMediaKind } from "@/features/media/media-refresh";

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
      <LogEditor
        isOpen
        onClose={onClose}
        subject={{
          type: "existing",
          kind: toMediaKind(movie.mediaType),
          tmdbId: movie.tmdbId,
          title: movie.title,
          year: movie.releaseYear,
          posterPath: movie.posterPath,
          logId: log.id,
          watchedDate: log.watchedDate,
          rating: log.rating,
          rewatch: log.rewatch,
          review: review && { id: review.id, content: review.content, containsSpoilers: review.containsSpoilers },
        }}
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
