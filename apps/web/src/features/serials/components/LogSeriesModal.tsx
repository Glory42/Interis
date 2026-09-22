import { useState, type ComponentProps, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LogMediaDialog } from "@/features/diary/components/log-media/LogMediaDialog";
import { LogMediaLoginTrigger } from "@/features/diary/components/log-media/LogMediaLoginTrigger";
import type { LogMediaInitialState } from "@/features/diary/components/log-media/types";
import { useMediaLogSubmission } from "@/features/diary/hooks/useMediaLogSubmission";
import { getPosterUrl } from "@/features/serials/components/utils";
import { useCreateSeriesLog, useSeriesInteraction, useUpdateSeriesInteraction } from "@/features/serials/hooks/useSerials";

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
  const interactionQuery = useSeriesInteraction(tmdbId, isOpen);
  const updateInteractionMutation = useUpdateSeriesInteraction(tmdbId);

  const submission = useMediaLogSubmission({
    isOpen,
    onOpenChange: setIsOpen,
    initialState,
    likedFromInteraction: interactionQuery.data?.liked ?? false,
    submitLog: (input) => createSeriesLogMutation.mutateAsync(input),
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
              accent="serial"
              title={seriesTitle}
              year={seriesFirstAirYear}
              yearDescriptionLabel="First aired in"
              posterUrl={getPosterUrl(seriesPosterPath)}
              watchedDate={submission.watchedDate}
              rating={submission.rating}
              rewatch={submission.rewatch}
              review={submission.review}
              containsSpoilers={submission.containsSpoilers}
              liked={submission.liked}
              formError={submission.formError}
              reviewMaxLength={REVIEW_MAX_LENGTH}
              reviewPlaceholder="Share your thoughts about this series..."
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
