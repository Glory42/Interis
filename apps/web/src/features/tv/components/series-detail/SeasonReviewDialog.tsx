import { useState } from "react";
import { createPortal } from "react-dom";
import { LogEditorDialog } from "@/features/media/log-editor/LogEditorDialog";
import { getPosterUrl } from "@/features/media/tmdb-images";
import type { MyTitleReview } from "@/features/reviews/api";
import type { SeriesDetailResponse } from "@/features/tv/api";
import {
  useDeleteEpisodeReview,
  useDeleteSeasonReview,
  useUpsertEpisodeReview,
  useUpsertSeasonReview,
} from "@/features/tv/hooks/useTv";

export type SeasonReviewTarget =
  | { type: "season" }
  | { type: "episode"; episodeNumber: number; episodeName: string };

// The season's or episode's own Interaction, which saves as it changes.
export type SeasonReviewInteraction = {
  watched: boolean;
  liked: boolean;
  rating: number | null;
  onWatchedChange: (nextValue: boolean) => void;
  onLikedChange: (nextValue: boolean) => void;
  onRatingChange: (nextValue: number | null) => void;
};

type SeasonReviewDialogProps = {
  tmdbId: number;
  season: Pick<SeriesDetailResponse["series"]["seasons"][number], "seasonNumber" | "name" | "posterPath">;
  target: SeasonReviewTarget;
  // The review picked in the chooser; null writes a new one (#74).
  editingReview: MyTitleReview | null;
  interaction: SeasonReviewInteraction;
  onClose: () => void;
};

const pad = (value: number) => String(value).padStart(2, "0");

// The season/episode review editor; mounted per open, so the text starts from the picked review.
export const SeasonReviewDialog = ({
  tmdbId,
  season,
  target,
  editingReview,
  interaction,
  onClose,
}: SeasonReviewDialogProps) => {
  const [text, setText] = useState(editingReview?.content ?? "");
  const [containsSpoilers, setContainsSpoilers] = useState(editingReview?.containsSpoilers ?? false);
  const [formError, setFormError] = useState<string | null>(null);
  const upsertSeasonReview = useUpsertSeasonReview(tmdbId, season.seasonNumber);
  const deleteSeasonReview = useDeleteSeasonReview(tmdbId, season.seasonNumber);
  const upsertEpisodeReview = useUpsertEpisodeReview(tmdbId, season.seasonNumber);
  const deleteEpisodeReview = useDeleteEpisodeReview(tmdbId, season.seasonNumber);
  const isEpisode = target.type === "episode";
  const isSubmitting = isEpisode
    ? upsertEpisodeReview.isPending || deleteEpisodeReview.isPending
    : upsertSeasonReview.isPending || deleteSeasonReview.isPending;

  const save = async () => {
    const content = text.trim();
    if (!content) {
      setFormError("Please write a review before saving.");
      return;
    }
    setFormError(null);
    const input = editingReview
      ? { content, containsSpoilers, reviewId: editingReview.id }
      : { content, containsSpoilers, createNew: true };
    try {
      await (target.type === "episode"
        ? upsertEpisodeReview.mutateAsync({ episodeNumber: target.episodeNumber, input })
        : upsertSeasonReview.mutateAsync(input));
      onClose();
    } catch {
      setFormError("Failed to save the review. Please try again.");
    }
  };

  const remove = async (reviewId: string) => {
    setFormError(null);
    try {
      await (target.type === "episode"
        ? deleteEpisodeReview.mutateAsync({ episodeNumber: target.episodeNumber, reviewId })
        : deleteSeasonReview.mutateAsync(reviewId));
      onClose();
    } catch {
      setFormError("Could not delete the review. Please try again.");
    }
  };

  const seasonCode = `S${pad(season.seasonNumber)}`;

  return createPortal(
    <LogEditorDialog
      mode="review"
      media={{
        kind: "tv",
        title:
          target.type === "episode"
            ? target.episodeName || `Episode ${target.episodeNumber}`
            : season.name || `Season ${season.seasonNumber}`,
        subtitle: target.type === "episode" ? `${seasonCode} · E${pad(target.episodeNumber)}` : seasonCode,
        posterUrl: getPosterUrl(season.posterPath),
      }}
      when={{ type: "watched", watched: interaction.watched, onWatchedChange: interaction.onWatchedChange }}
      rating={interaction.rating}
      onRatingChange={interaction.onRatingChange}
      liked={interaction.liked}
      onLikedChange={interaction.onLikedChange}
      review={{
        text,
        containsSpoilers,
        placeholder: `Share your thoughts about this ${isEpisode ? "episode" : "season"}...`,
        onTextChange: setText,
        onContainsSpoilersChange: setContainsSpoilers,
      }}
      formError={formError}
      isSubmitting={isSubmitting}
      onSubmit={() => {
        void save();
      }}
      onClose={onClose}
      deleteAction={
        editingReview
          ? {
              label: "Delete review",
              onClick: () => {
                void remove(editingReview.id);
              },
            }
          : undefined
      }
    />,
    document.body,
  );
};
