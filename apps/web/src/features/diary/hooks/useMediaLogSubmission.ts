import { useEffect, useState, type FormEvent } from "react";
import type { LogMediaInitialState } from "@/features/diary/components/log-media/types";
import { isApiError } from "@/lib/api-client";
import { todayAsLocalDateInput } from "@/lib/time";

type LogSubmitInput = {
  watchedDate: string;
  rating?: number;
  rewatch: boolean;
  review?: string;
  containsSpoilers?: boolean;
};

type UseMediaLogSubmissionArgs = {
  // Owned by the caller, not this hook: the caller's interaction query
  // (useMovieInteraction/useSeriesInteraction) must be enabled by the same
  // isOpen flag, and a query hook can't be called from inside another
  // hook conditionally on a value that hook itself produces. Passing
  // isOpen/onOpenChange in (rather than owning open state here) breaks
  // that circular dependency while still centralizing everything else.
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  initialState?: LogMediaInitialState;
  likedFromInteraction: boolean;
  submitLog: (input: LogSubmitInput) => Promise<unknown>;
  updateLiked: (liked: boolean) => Promise<unknown>;
};

// Deep module: owns the diary-log modal's form lifecycle — body-scroll
// lock, form field state, the liked override, and the
// submit-both-mutations-then-close-or-error cycle. LogMovieModal and
// LogSeriesModal previously duplicated all of this; they now only differ
// in which mutation they hand in as submitLog/updateLiked, and in the
// interaction-query result they pass as likedFromInteraction.
export const useMediaLogSubmission = ({
  isOpen,
  onOpenChange,
  initialState,
  likedFromInteraction,
  submitLog,
  updateLiked,
}: UseMediaLogSubmissionArgs) => {
  const [watchedDate, setWatchedDate] = useState(todayAsLocalDateInput);
  const [rating, setRating] = useState<number | null>(null);
  const [rewatch, setRewatch] = useState(false);
  const [review, setReview] = useState("");
  const [containsSpoilers, setContainsSpoilers] = useState(false);
  // null = no manual toggle yet this session; falls back to the fetched
  // interaction once it resolves, so no effect is needed to sync it in.
  const [likedOverride, setLikedOverride] = useState<boolean | null>(null);
  const liked = likedOverride ?? likedFromInteraction;
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    onOpenChange(false);
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
    onOpenChange(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const normalizedReview = review.trim();

    setIsSubmitting(true);
    try {
      await Promise.all([
        submitLog({
          watchedDate,
          ...(rating !== null ? { rating } : {}),
          rewatch,
          ...(normalizedReview.length > 0
            ? { review: normalizedReview, containsSpoilers }
            : {}),
        }),
        updateLiked(liked),
      ]);

      closeModal();
    } catch (error) {
      if (isApiError(error)) {
        setFormError(error.message);
        return;
      }

      setFormError("Could not save this review right now.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    openModal,
    closeModal,
    watchedDate,
    setWatchedDate,
    rating,
    setRating,
    rewatch,
    setRewatch,
    review,
    setReview,
    containsSpoilers,
    setContainsSpoilers,
    liked,
    setLikedOverride,
    formError,
    isSubmitting,
    handleSubmit,
  };
};
