import {
  useEffect,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LogMediaDialog } from "@/features/diary/components/log-media/LogMediaDialog";
import { LogMediaLoginTrigger } from "@/features/diary/components/log-media/LogMediaLoginTrigger";
import type { LogMediaInitialState } from "@/features/diary/components/log-media/types";
import { useCreateDiaryEntry } from "@/features/diary/hooks/useDiary";
import { getPosterUrl } from "@/features/films/components/utils";
import { isApiError } from "@/lib/api-client";
import { todayAsLocalDateInput } from "@/lib/time";
import { useMovieInteraction, useUpdateMovieInteraction } from "@/features/interactions/hooks/useInteractions";

type LogFilmModalProps = {
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

export const LogFilmModal = ({
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
}: LogFilmModalProps) => {
  const { user } = useAuth();
  const createDiaryMutation = useCreateDiaryEntry();
  const [isOpen, setIsOpen] = useState(false);
  const interactionQuery = useMovieInteraction(tmdbId, isOpen);
  const updateInteractionMutation = useUpdateMovieInteraction(tmdbId);
  const [watchedDate, setWatchedDate] = useState(todayAsLocalDateInput);
  const [rating, setRating] = useState<number | null>(null);
  const [rewatch, setRewatch] = useState(false);
  const [review, setReview] = useState("");
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  // null = no manual toggle yet this session; falls back to the fetched
  // interaction once it resolves, so no effect is needed to sync it in.
  const [likedOverride, setLikedOverride] = useState<boolean | null>(null);
  const liked = likedOverride ?? interactionQuery.data?.liked ?? false;
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  const closeModal = () => {
    setIsOpen(false);
    setFormError(null);
  };

  const openModal = () => {
    setWatchedDate(initialState?.watchedDate ?? todayAsLocalDateInput());
    setRating(initialState?.rating ?? null);
    setRewatch(initialState?.rewatch ?? false);
    setReview(initialState?.reviewContent ?? "");
    setContainsSpoilers(initialState?.containsSpoilers ?? false);
    setLikedOverride(null);
    setFormError(null);
    setIsOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const normalizedReview = review.trim();

    try {
      await Promise.all([
        createDiaryMutation.mutateAsync({
          tmdbId,
          watchedDate,
          ...(rating !== null ? { rating } : {}),
          rewatch,
          ...(normalizedReview.length > 0
            ? {
                review: normalizedReview,
                containsSpoilers,
              }
            : {}),
        }),
        updateInteractionMutation.mutateAsync({
          liked,
        }),
      ]);

      closeModal();
    } catch (error) {
      if (isApiError(error)) {
        setFormError(error.message);
        return;
      }

      setFormError("Could not save this review right now.");
    }
  };

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
      <Button onClick={openModal} variant={triggerVariant} size={triggerSize} className={triggerClassName}>
        {triggerContent ?? triggerLabel ?? "Write a Review"}
      </Button>

      {isOpen
        ? createPortal(
            <LogMediaDialog
              title={movieTitle}
              year={movieReleaseYear}
              yearDescriptionLabel="Released in"
              posterUrl={getPosterUrl(moviePosterPath)}
              watchedDate={watchedDate}
              rating={rating}
              rewatch={rewatch}
              review={review}
              containsSpoilers={containsSpoilers}
              liked={liked}
              formError={formError}
              reviewMaxLength={REVIEW_MAX_LENGTH}
              reviewPlaceholder="Share your thoughts about this film..."
              isSubmitting={createDiaryMutation.isPending || updateInteractionMutation.isPending}
              onClose={closeModal}
              onSubmit={handleSubmit}
              onWatchedDateChange={setWatchedDate}
              onRatingChange={setRating}
              onRewatchChange={setRewatch}
              onReviewChange={setReview}
              onContainsSpoilersChange={setContainsSpoilers}
              onLikedChange={setLikedOverride}
            />,
            document.body,
          )
        : null}
    </>
  );
};
