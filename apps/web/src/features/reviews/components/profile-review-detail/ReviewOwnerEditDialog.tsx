import { useNavigate } from "@tanstack/react-router";
import { FeedReviewEditDialog } from "@/features/feed/components/FeedReviewEditDialog";
import { LogEditor } from "@/features/media/log-editor/LogEditor";
import { toMediaKind } from "@/features/media/media-cache";
import type { ReviewDetail } from "@/features/reviews/api";

type ReviewOwnerEditDialogProps = {
  detail: ReviewDetail;
  username: string;
  isOpen: boolean;
  onClose: () => void;
};

// A review written with a log edits the whole log: date, rewatch, rating, like, text and spoilers.
// A standalone review only has its text and spoiler flag to edit.
export const ReviewOwnerEditDialog = ({ detail, username, isOpen, onClose }: ReviewOwnerEditDialogProps) => {
  const navigate = useNavigate();
  if (!isOpen) return null;

  const { log, media } = detail;
  if (!log) {
    return (
      <FeedReviewEditDialog
        isOpen
        onClose={onClose}
        reviewId={detail.id}
        initialContent={detail.content}
        containsSpoilers={detail.containsSpoilers}
      />
    );
  }

  return (
    <LogEditor
      isOpen
      onClose={onClose}
      // Emptying the text deletes the review, so its page has nothing left to show.
      onSaved={(changes) => {
        if (changes?.review === null) void navigate({ to: "/profile/$username/reviews", params: { username } });
      }}
      subject={{
        type: "existing",
        kind: toMediaKind(detail.mediaType),
        tmdbId: media.tmdbId,
        title: media.title,
        year: media.releaseYear,
        posterPath: media.posterPath,
        logId: log.id,
        watchedDate: log.watchedDate,
        rating: log.rating,
        rewatch: log.rewatch,
        review: { id: detail.id, content: detail.content, containsSpoilers: detail.containsSpoilers },
      }}
    />
  );
};
