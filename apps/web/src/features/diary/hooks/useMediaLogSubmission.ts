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
  // Owned by the caller: its interaction query must be enabled by this
  // same flag, and a hook can't be called conditionally on another hook's output.
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  initialState?: LogMediaInitialState;
  likedFromInteraction: boolean;
  submitLog: (input: LogSubmitInput) => Promise<unknown>;
  updateLiked: (liked: boolean) => Promise<unknown>;
};

// Owns the log-modal form lifecycle; LogMovieModal/LogSeriesModal only
// differ in the mutations they hand in.
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
