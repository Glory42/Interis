import { LineRowsSkeleton, LoadingRegion } from "@/components/ui/PageSkeletons";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { SerialDetailResponse } from "@/features/serials/api";
import { getPosterUrl } from "@/features/serials/components/utils";
import {
  useSeriesSeasonDetail,
  useUpdateSeasonInteraction,
  useUpdateEpisodeInteraction,
  useMarkWatchedThrough,
  useUpsertSeasonReview,
  useDeleteSeasonReview,
  useUpsertEpisodeReview,
  useDeleteEpisodeReview,
} from "@/features/serials/hooks/useSerials";
import { useReviewDraft } from "@/features/serials/hooks/serials/use-review-draft";
import { useReviewSubmission } from "@/features/serials/hooks/serials/use-review-submission";
import type { MyTitleReview } from "@/features/reviews/api";
import { ReviewChooserDialog } from "@/features/reviews/components/ReviewChooserDialog";
import { useReviewChooser } from "@/features/reviews/hooks/useReviewChooser";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LogMediaDialog } from "@/features/diary/components/log-media/LogMediaDialog";
import { SeasonHeaderRow } from "@/features/serials/components/serial-detail/SeasonHeaderRow";
import { EpisodeRow } from "@/features/serials/components/serial-detail/EpisodeRow";
import { ReelCells } from "@/components/film/ReelCells";
import { BELOW_MD_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

type ReviewSubject =
  | { type: "season" }
  | { type: "episode"; episodeNumber: number; episodeName: string };

type SeasonAccordionItemProps = {
  tmdbId: number;
  season: SerialDetailResponse["series"]["seasons"][number];
  isOpen: boolean;
  onToggle: () => void;
  // compact: a phone row that opens the season screen. screen: that screen's episode list.
  variant?: "accordion" | "compact" | "screen";
};

export const SeasonAccordionItem = ({
  tmdbId,
  season,
  isOpen,
  onToggle,
  variant = "accordion",
}: SeasonAccordionItemProps) => {
  const { user } = useAuth();
  const isPhone = useMediaQuery(BELOW_MD_QUERY);
  const showEpisodes = variant === "screen" || (variant === "accordion" && isOpen);
  const seasonDetailQuery = useSeriesSeasonDetail(
    tmdbId,
    season.seasonNumber,
    showEpisodes,
  );

  const episodes = seasonDetailQuery.data?.episodes ?? [];

  // The open review editor: which season/episode, and the review being
  // edited (null = writing a new one, #74).
  const [activeReviewModal, setActiveReviewModal] = useState<
    (ReviewSubject & { editingReview: MyTitleReview | null }) | null
  >(null);
  // The season/episode the review chooser was opened for.
  const [chooserSubject, setChooserSubject] = useState<ReviewSubject | null>(null);
  const reviewChooser = useReviewChooser();
  const reviewDraft = useReviewDraft();

  const updateSeasonInteractionMutation = useUpdateSeasonInteraction(tmdbId);
  const updateEpisodeInteractionMutation = useUpdateEpisodeInteraction(tmdbId, season.seasonNumber);
  const markWatchedThroughMutation = useMarkWatchedThrough(tmdbId, season.seasonNumber);

  const upsertSeasonReviewMutation = useUpsertSeasonReview(tmdbId, season.seasonNumber);
  const deleteSeasonReviewMutation = useDeleteSeasonReview(tmdbId, season.seasonNumber);
  const upsertEpisodeReviewMutation = useUpsertEpisodeReview(tmdbId, season.seasonNumber);
  const deleteEpisodeReviewMutation = useDeleteEpisodeReview(tmdbId, season.seasonNumber);

  const openReviewEditor = (subject: ReviewSubject, review: MyTitleReview | null) => {
    reviewDraft.start(review);
    setActiveReviewModal({ ...subject, editingReview: review });
  };

  const handleOpenReview = (subject: ReviewSubject) => {
    setChooserSubject(subject);
    reviewChooser.start(
      subject.type === "season"
        ? { mediaType: "tv_season", tmdbId, seasonNumber: season.seasonNumber }
        : {
            mediaType: "tv_episode",
            tmdbId,
            seasonNumber: season.seasonNumber,
            episodeNumber: subject.episodeNumber,
          },
      () => openReviewEditor(subject, null),
    );
  };

  const editingReviewId = activeReviewModal?.editingReview?.id;

  const reviewSubmission = useReviewSubmission({
    draft: reviewDraft,
    saveReview: (draftInput) => {
      const input = editingReviewId
        ? { ...draftInput, reviewId: editingReviewId }
        : { ...draftInput, createNew: true };
      return activeReviewModal?.type === "episode"
        ? upsertEpisodeReviewMutation.mutateAsync({
            episodeNumber: activeReviewModal.episodeNumber,
            input,
          })
        : upsertSeasonReviewMutation.mutateAsync(input);
    },
    deleteReview: async () => {
      if (!editingReviewId) return;
      await (activeReviewModal?.type === "episode"
        ? deleteEpisodeReviewMutation.mutateAsync({
            episodeNumber: activeReviewModal.episodeNumber,
            reviewId: editingReviewId,
          })
        : deleteSeasonReviewMutation.mutateAsync(editingReviewId));
    },
    onClose: () => setActiveReviewModal(null),
  });

  const handleSeasonWatchedChange = (nextWatched: boolean) => {
    updateSeasonInteractionMutation.mutate({
      seasonNumber: season.seasonNumber,
      input: { watched: nextWatched },
    });
  };

  const handleSeasonWatchedToggle = () => handleSeasonWatchedChange(!(season.viewerInteraction?.watched ?? false));

  const handleSeasonLikedChange = (nextLiked: boolean) => {
    updateSeasonInteractionMutation.mutate({
      seasonNumber: season.seasonNumber,
      input: { liked: nextLiked },
    });
  };

  const handleSeasonLikedToggle = () => handleSeasonLikedChange(!(season.viewerInteraction?.liked ?? false));

  // LaunchTrack commits once per drag but once per arrow-key release, so
  // debounce the mutation: dialing in a rating shouldn't fire a PATCH (and a
  // "Rated" feed activity) per intermediate value.
  const seasonRatingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const episodeRatingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (seasonRatingTimeoutRef.current) clearTimeout(seasonRatingTimeoutRef.current);
      if (episodeRatingTimeoutRef.current) clearTimeout(episodeRatingTimeoutRef.current);
    };
  }, []);

  const handleSeasonRatingChange = (nextRating: number | null) => {
    if (seasonRatingTimeoutRef.current) clearTimeout(seasonRatingTimeoutRef.current);
    seasonRatingTimeoutRef.current = setTimeout(() => {
      updateSeasonInteractionMutation.mutate({
        seasonNumber: season.seasonNumber,
        input: { rating: nextRating },
      });
    }, 500);
  };

  const handleEpisodeWatchedChange = (episodeNumber: number, nextWatched: boolean) => {
    updateEpisodeInteractionMutation.mutate({
      episodeNumber,
      input: { watched: nextWatched },
    });
  };

  const handleEpisodeWatchedToggle = (episodeNumber: number, currentWatched: boolean) => {
    handleEpisodeWatchedChange(episodeNumber, !currentWatched);
  };

  const handleEpisodeLikedChange = (episodeNumber: number, nextLiked: boolean) => {
    updateEpisodeInteractionMutation.mutate({
      episodeNumber,
      input: { liked: nextLiked },
    });
  };

  const handleEpisodeLikedToggle = (episodeNumber: number, currentLiked: boolean) => {
    handleEpisodeLikedChange(episodeNumber, !currentLiked);
  };

  const handleEpisodeRatingChange = (episodeNumber: number, nextRating: number | null) => {
    if (episodeRatingTimeoutRef.current) clearTimeout(episodeRatingTimeoutRef.current);
    episodeRatingTimeoutRef.current = setTimeout(() => {
      updateEpisodeInteractionMutation.mutate({
        episodeNumber,
        input: { rating: nextRating },
      });
    }, 500);
  };

  const seasonWatched = season.viewerInteraction?.watched ?? false;
  const seasonLiked = season.viewerInteraction?.liked ?? false;
  const seasonRating = season.viewerInteraction?.rating ?? null;

  return (
    <section aria-label={season.name || `Season ${season.seasonNumber}`}>
      {variant === "screen" ? (
        <ReelCells total={season.episodeCount ?? 0} watched={season.watchedEpisodeCount} className="py-2" />
      ) : (
        <SeasonHeaderRow
          season={season}
          isOpen={isOpen}
          compact={variant === "compact"}
          showInteractions={Boolean(user)}
          onToggle={onToggle}
          onToggleWatched={handleSeasonWatchedToggle}
          onToggleLiked={handleSeasonLikedToggle}
          onRatingChange={handleSeasonRatingChange}
          onOpenReview={() => handleOpenReview({ type: "season" })}
        />
      )}

      {showEpisodes ? (
        <div className={cn("border-t border-[color:var(--line)]", variant === "accordion" && "mb-3 ml-[46px]")}>
          {seasonDetailQuery.isPending ? (
            <LoadingRegion label="Loading episodes">
              <LineRowsSkeleton count={4} withAvatar={false} />
            </LoadingRegion>
          ) : seasonDetailQuery.isError ? (
            <p className="body-s py-3 text-[color:var(--danger)]">Could not load episodes for this season.</p>
          ) : episodes.length === 0 ? (
            <p className="body-s py-3 text-muted-foreground">No episodes for this season yet.</p>
          ) : (
            episodes.map((episode) => (
              <EpisodeRow
                key={`episode-${episode.id}`}
                episode={episode}
                layout={isPhone ? "phone" : "line"}
                showInteractions={Boolean(user)}
                onToggleWatched={handleEpisodeWatchedToggle}
                onToggleLiked={handleEpisodeLikedToggle}
                onRatingChange={handleEpisodeRatingChange}
                onMarkWatchedThrough={(episodeNumber) => markWatchedThroughMutation.mutate(episodeNumber)}
                onOpenReview={(episodeNumber, episodeName) =>
                  handleOpenReview({ type: "episode", episodeNumber, episodeName })
                }
              />
            ))
          )}
        </div>
      ) : null}

      {activeReviewModal?.type === "season" && createPortal(
        <LogMediaDialog
          accent="serial"
          title={season.name || `Season ${season.seasonNumber}`}
          subtitle={`S${String(season.seasonNumber).padStart(2, "0")}`}
          posterUrl={getPosterUrl(season.posterPath)}
          review={reviewDraft.content}
          onReviewChange={reviewDraft.onContentChange}
          containsSpoilers={reviewDraft.containsSpoilers}
          onContainsSpoilersChange={reviewDraft.setContainsSpoilers}
          rating={seasonRating}
          onRatingChange={handleSeasonRatingChange}
          liked={seasonLiked}
          onLikedChange={handleSeasonLikedChange}
          watched={seasonWatched}
          onWatchedChange={handleSeasonWatchedChange}
          isSubmitting={upsertSeasonReviewMutation.isPending || deleteSeasonReviewMutation.isPending}
          onClose={reviewSubmission.close}
          onSubmit={reviewSubmission.handleSubmit}
          onDelete={editingReviewId ? reviewSubmission.handleDelete : undefined}
          submitLabel="Save"
          formError={reviewSubmission.formError}
          reviewMaxLength={10000}
          reviewPlaceholder="Share your thoughts about this season..."
        />,
        document.body,
      )}

      {activeReviewModal?.type === "episode" && (() => {
        const selectedEpisode = episodes.find((e) => e.episodeNumber === activeReviewModal.episodeNumber);
        const epWatched = selectedEpisode?.viewerInteraction?.watched ?? false;
        const epLiked = selectedEpisode?.viewerInteraction?.liked ?? false;
        const epRating = selectedEpisode?.viewerInteraction?.rating ?? null;

        return createPortal(
          <LogMediaDialog
            accent="serial"
            title={activeReviewModal.episodeName || `Episode ${activeReviewModal.episodeNumber}`}
            subtitle={`S${String(season.seasonNumber).padStart(2, "0")} · E${String(activeReviewModal.episodeNumber).padStart(2, "0")}`}
            posterUrl={getPosterUrl(season.posterPath)}
            review={reviewDraft.content}
            onReviewChange={reviewDraft.onContentChange}
            containsSpoilers={reviewDraft.containsSpoilers}
            onContainsSpoilersChange={reviewDraft.setContainsSpoilers}
            rating={epRating}
            onRatingChange={(nextRating) => handleEpisodeRatingChange(activeReviewModal.episodeNumber, nextRating)}
            liked={epLiked}
            onLikedChange={(nextLiked) => handleEpisodeLikedChange(activeReviewModal.episodeNumber, nextLiked)}
            watched={epWatched}
            onWatchedChange={(nextWatched) => handleEpisodeWatchedChange(activeReviewModal.episodeNumber, nextWatched)}
            isSubmitting={upsertEpisodeReviewMutation.isPending || deleteEpisodeReviewMutation.isPending}
            onClose={reviewSubmission.close}
            onSubmit={reviewSubmission.handleSubmit}
            onDelete={editingReviewId ? reviewSubmission.handleDelete : undefined}
            submitLabel="Save"
            formError={reviewSubmission.formError}
            reviewMaxLength={10000}
            reviewPlaceholder="Share your thoughts about this episode..."
          />,
          document.body,
        );
      })()}

      <ReviewChooserDialog
        reviews={reviewChooser.reviews}
        title={
          chooserSubject?.type === "episode"
            ? `Episode ${chooserSubject.episodeNumber} reviews`
            : `${season.name || `Season ${season.seasonNumber}`} reviews`
        }
        writeNewLabel="Write a new review"
        onWriteNew={reviewChooser.writeNew}
        onEdit={(review) => {
          reviewChooser.close();
          if (chooserSubject) openReviewEditor(chooserSubject, review);
        }}
        onClose={reviewChooser.close}
      />
    </section>
  );
};
