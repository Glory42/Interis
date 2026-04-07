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
import { getPosterUrl } from "@/features/serials/components/utils";
import { useCreateSeriesLog } from "@/features/serials/hooks/useSerials";
import { isApiError } from "@/lib/api-client";

type LogSeriesModalProps = {
  tmdbId: number;
  seriesTitle: string;
  seriesFirstAirYear: number | null;
  seriesPosterPath: string | null;
  initialState?: LogMediaInitialState;
  triggerLabel?: string;
  triggerContent?: ReactNode;
  triggerClassName?: string;
  triggerVariant?: ComponentProps<typeof Button>["variant"];
  triggerSize?: ComponentProps<typeof Button>["size"];
};

const todayAsDateInput = (): string => new Date().toISOString().slice(0, 10);
const REVIEW_MAX_LENGTH = 5000;

export const LogSeriesModal = ({
  tmdbId,
  seriesTitle,
  seriesFirstAirYear,
  seriesPosterPath,
  initialState,
  triggerLabel,
  triggerContent,
  triggerClassName,
  triggerVariant,
  triggerSize,
}: LogSeriesModalProps) => {
  const { user } = useAuth();
  const createSeriesLogMutation = useCreateSeriesLog(tmdbId);

  const [isOpen, setIsOpen] = useState(false);
  const [watchedDate, setWatchedDate] = useState(todayAsDateInput);
  const [ratingOutOfFive, setRatingOutOfFive] = useState<number | null>(null);
  const [rewatch, setRewatch] = useState(false);
  const [review, setReview] = useState("");
  const [containsSpoilers, setContainsSpoilers] = useState(false);
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
    setWatchedDate(initialState?.watchedDate ?? todayAsDateInput());
    setRatingOutOfFive(initialState?.ratingOutOfFive ?? null);
    setRewatch(initialState?.rewatch ?? false);
    setReview(initialState?.reviewContent ?? "");
    setContainsSpoilers(initialState?.containsSpoilers ?? false);
    setFormError(null);
    setIsOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const normalizedReview = review.trim();

    try {
      await createSeriesLogMutation.mutateAsync({
        watchedDate,
        ...(ratingOutOfFive !== null ? { ratingOutOfFive } : {}),
        rewatch,
        ...(normalizedReview.length > 0
          ? {
              review: normalizedReview,
              containsSpoilers,
            }
          : {}),
      });

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
              title={seriesTitle}
              year={seriesFirstAirYear}
              yearDescriptionLabel="First aired in"
              posterUrl={getPosterUrl(seriesPosterPath)}
              watchedDate={watchedDate}
              ratingOutOfFive={ratingOutOfFive}
              rewatch={rewatch}
              review={review}
              containsSpoilers={containsSpoilers}
              formError={formError}
              reviewMaxLength={REVIEW_MAX_LENGTH}
              reviewPlaceholder="Share your thoughts about this series..."
              isSubmitting={createSeriesLogMutation.isPending}
              onClose={closeModal}
              onSubmit={handleSubmit}
              onWatchedDateChange={setWatchedDate}
              onRatingChange={setRatingOutOfFive}
              onRewatchChange={setRewatch}
              onReviewChange={setReview}
              onContainsSpoilersChange={setContainsSpoilers}
            />,
            document.body,
          )
        : null}
    </>
  );
};
