import { useState, type ComponentProps, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LogMediaDialog } from "@/features/diary/components/log-media/LogMediaDialog";
import { LogMediaLoginTrigger } from "@/features/diary/components/log-media/LogMediaLoginTrigger";
import type { LogMediaInitialState } from "@/features/diary/components/log-media/types";
import { useMediaLogSubmission } from "@/features/diary/hooks/useMediaLogSubmission";
import { useCreateDiaryEntry } from "@/features/diary/hooks/useDiary";
import { getPosterUrl } from "@/features/movies/components/utils";
import { useMovieInteraction, useUpdateMovieInteraction } from "@/features/interactions/hooks/useInteractions";

type LogMovieModalProps = {
  tmdbId: number;
  movieTitle: string;
  movieReleaseYear: number | null;
  moviePosterPath: string | null;
  initialState?: LogMediaInitialState;
  triggerLabel?: string;
  triggerContent?: ReactNode;
  triggerClassName?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
  triggerSize?: ComponentProps<typeof Button>["size"];
};

const REVIEW_MAX_LENGTH = 5000;

export const LogMovieModal = ({
  tmdbId,
  movieTitle,
  movieReleaseYear,
  moviePosterPath,
  initialState,
  triggerLabel,
  triggerContent,
  triggerClassName,
  triggerVariant,
  triggerSize,
}: LogMovieModalProps) => {
  const { user } = useAuth();
  const createDiaryMutation = useCreateDiaryEntry();
  const [isOpen, setIsOpen] = useState(false);
  const interactionQuery = useMovieInteraction(tmdbId, isOpen);
  const updateInteractionMutation = useUpdateMovieInteraction(tmdbId);

  const submission = useMediaLogSubmission({
    isOpen,
    onOpenChange: setIsOpen,
    initialState,
    likedFromInteraction: interactionQuery.data?.liked ?? false,
    submitLog: (input) => createDiaryMutation.mutateAsync({ tmdbId, ...input }),
    updateLiked: (liked) => updateInteractionMutation.mutateAsync({ liked }),
  });

  if (!user) {
    return (
      <LogMediaLoginTrigger
        triggerLabel={triggerLabel}
        triggerClassName={triggerClassName}
        triggerVariant={triggerVariant}
        triggerSize={triggerSize}
      />
    );
  }

  return (
    <>
      <Button
        onClick={submission.openModal}
        variant={triggerVariant}
        size={triggerSize}
        className={triggerClassName}
      >
        {triggerContent ?? triggerLabel ?? "Write a Review"}
      </Button>

      {isOpen
        ? createPortal(
            <LogMediaDialog
              accent="movie"
              title={movieTitle}
              year={movieReleaseYear}
              yearDescriptionLabel="Released in"
              posterUrl={getPosterUrl(moviePosterPath)}
              watchedDate={submission.watchedDate}
              rating={submission.rating}
              rewatch={submission.rewatch}
              review={submission.review}
              containsSpoilers={submission.containsSpoilers}
              liked={submission.liked}
              formError={submission.formError}
              reviewMaxLength={REVIEW_MAX_LENGTH}
              reviewPlaceholder="Share your thoughts about this film..."
              isSubmitting={submission.isSubmitting}
              onClose={submission.closeModal}
              onSubmit={submission.handleSubmit}
              onWatchedDateChange={submission.setWatchedDate}
              onRatingChange={submission.setRating}
              onRewatchChange={submission.setRewatch}
              onReviewChange={submission.setReview}
              onContainsSpoilersChange={submission.setContainsSpoilers}
              onLikedChange={submission.setLikedOverride}
            />,
            document.body,
          )
        : null}
    </>
  );
};
