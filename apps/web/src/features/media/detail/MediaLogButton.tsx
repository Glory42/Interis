import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { FeedReviewEditDialog } from "@/features/feed/components/FeedReviewEditDialog";
import { LogEditor } from "@/features/media/log-editor/LogEditor";
import type { LogMediaTitle, LogSubject } from "@/features/media/log-editor/log-subject";
import type { MyTitleReview } from "@/features/reviews/api";
import { ReviewChooserDialog } from "@/features/reviews/components/ReviewChooserDialog";
import { useReviewChooser } from "@/features/reviews/hooks/useReviewChooser";

type MediaLogButtonProps = {
  media: LogMediaTitle;
  // The viewer's Your Rating and whether they've logged the title, for a new log.
  rating: number | null;
  hasLogged: boolean;
};

const pillClassName =
  "h-12 w-full rounded-full text-base font-bold shadow-[0_0_24px_color-mix(in_srgb,var(--primary)_35%,transparent)] sm:h-12";

// The detail page's one primary action. With reviews of the title already, the viewer first picks
// a new log or one to edit (#74); a review written with a log is edited together with it.
export const MediaLogButton = ({ media, rating, hasLogged }: MediaLogButtonProps) => {
  const { user } = useAuth();
  const chooser = useReviewChooser();
  const [subject, setSubject] = useState<LogSubject | null>(null);
  const [standaloneReview, setStandaloneReview] = useState<MyTitleReview | null>(null);
  const label = hasLogged ? "Log again" : "Log";

  if (!user) {
    return (
      <Button asChild variant="primary" size="sm" className={pillClassName}>
        <Link to="/login" viewTransition>{`Login to ${label.toLowerCase()}`}</Link>
      </Button>
    );
  }

  const startNewLog = () => setSubject({ ...media, type: "new", rating, rewatch: hasLogged });

  const editReview = (review: MyTitleReview) => {
    chooser.close();
    if (review.diaryEntryId && review.watchedDate) {
      setSubject({
        ...media,
        type: "existing",
        logId: review.diaryEntryId,
        watchedDate: review.watchedDate,
        rating: review.rating,
        rewatch: review.rewatch ?? false,
        review: { id: review.id, content: review.content, containsSpoilers: review.containsSpoilers },
      });
    } else {
      setStandaloneReview(review);
    }
  };

  return (
    <>
      <Button
        onClick={() =>
          chooser.start({ mediaType: media.kind === "film" ? "movie" : "tv", tmdbId: media.tmdbId }, startNewLog)
        }
        disabled={chooser.isChecking}
        variant="primary"
        className={pillClassName}
      >
        <PenLine aria-hidden className="size-4" />
        <span>{label}</span>
      </Button>

      <ReviewChooserDialog
        reviews={chooser.reviews}
        title="Your reviews"
        writeNewLabel="Log it again with a new review"
        onWriteNew={chooser.writeNew}
        onEdit={editReview}
        onClose={chooser.close}
      />
      {subject ? <LogEditor isOpen subject={subject} onClose={() => setSubject(null)} /> : null}
      <FeedReviewEditDialog
        isOpen={standaloneReview !== null}
        reviewId={standaloneReview?.id ?? ""}
        initialContent={standaloneReview?.content ?? ""}
        containsSpoilers={standaloneReview?.containsSpoilers ?? false}
        onClose={() => setStandaloneReview(null)}
      />
    </>
  );
};
