import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import type { SerialDetailResponse } from "@/features/serials/api";
import { getPosterUrl } from "@/features/serials/components/utils";
import {
  useSeriesSeasonDetail,
  useUpdateSeasonInteraction,
  useUpdateEpisodeInteraction,
  useSeasonReview,
  useUpsertSeasonReview,
  useDeleteSeasonReview,
  useEpisodeReview,
  useUpsertEpisodeReview,
  useDeleteEpisodeReview,
} from "@/features/serials/hooks/useSerials";
import { SERIAL_MODULE_STYLES } from "@/features/serials/components/serial-detail/styles";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LogMediaDialog } from "@/features/diary/components/log-media/LogMediaDialog";
import { SeasonHeaderRow } from "@/features/serials/components/serial-detail/SeasonHeaderRow";
import { EpisodeRow } from "@/features/serials/components/serial-detail/EpisodeRow";

type SeasonAccordionItemProps = {
  tmdbId: number;
  season: SerialDetailResponse["series"]["seasons"][number];
  isOpen: boolean;
  onToggle: () => void;
};

export const SeasonAccordionItem = ({
  tmdbId,
  season,
  isOpen,
  onToggle,
}: SeasonAccordionItemProps) => {
  const { user } = useAuth();
  const seasonDetailQuery = useSeriesSeasonDetail(
    tmdbId,
    season.seasonNumber,
    isOpen,
  );

  const episodes = seasonDetailQuery.data?.episodes ?? [];

  const [activeReviewModal, setActiveReviewModal] = useState<{
    type: "season";
  } | {
    type: "episode";
    episodeNumber: number;
    episodeName: string;
  } | null>(null);

  const [seasonReviewContent, setSeasonReviewContent] = useState("");
  const [seasonReviewContainsSpoilers, setSeasonReviewContainsSpoilers] = useState(false);
  const [seasonFormError, setSeasonFormError] = useState<string | null>(null);
  const [episodeReviewContent, setEpisodeReviewContent] = useState("");
  const [episodeReviewContainsSpoilers, setEpisodeReviewContainsSpoilers] = useState(false);
  const [episodeFormError, setEpisodeFormError] = useState<string | null>(null);

  const seasonReviewQuery = useSeasonReview(
    tmdbId,
    season.seasonNumber,
    activeReviewModal?.type === "season",
  );

  const activeEpisodeNumber = activeReviewModal?.type === "episode" ? activeReviewModal.episodeNumber : null;
  const episodeReviewQuery = useEpisodeReview(
    tmdbId,
    season.seasonNumber,
    activeEpisodeNumber ?? 0,
    activeEpisodeNumber !== null,
  );

  const updateSeasonInteractionMutation = useUpdateSeasonInteraction(tmdbId);
  const updateEpisodeInteractionMutation = useUpdateEpisodeInteraction(tmdbId, season.seasonNumber);

  const upsertSeasonReviewMutation = useUpsertSeasonReview(tmdbId, season.seasonNumber);
  const deleteSeasonReviewMutation = useDeleteSeasonReview(tmdbId, season.seasonNumber);

  const upsertEpisodeReviewMutation = useUpsertEpisodeReview(tmdbId, season.seasonNumber, activeEpisodeNumber ?? 0);
  const deleteEpisodeReviewMutation = useDeleteEpisodeReview(tmdbId, season.seasonNumber, activeEpisodeNumber ?? 0);

  // Hydrate the draft fields once each review query resolves (or when a
  // different season/episode's review loads). Adjusted during render
  // instead of in an effect to avoid an extra commit + repaint.
  const [prevSeasonReviewData, setPrevSeasonReviewData] = useState(seasonReviewQuery.data);
  if (seasonReviewQuery.data !== prevSeasonReviewData) {
    setPrevSeasonReviewData(seasonReviewQuery.data);
    setSeasonReviewContent(seasonReviewQuery.data?.content ?? "");
    setSeasonReviewContainsSpoilers(seasonReviewQuery.data?.containsSpoilers ?? false);
  }

  const [prevEpisodeReviewData, setPrevEpisodeReviewData] = useState(episodeReviewQuery.data);
  if (episodeReviewQuery.data !== prevEpisodeReviewData) {
    setPrevEpisodeReviewData(episodeReviewQuery.data);
    setEpisodeReviewContent(episodeReviewQuery.data?.content ?? "");
    setEpisodeReviewContainsSpoilers(episodeReviewQuery.data?.containsSpoilers ?? false);
  }

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

  // SpaceRatingInput (used inside the review modal) commits on every
  // click/drag/arrow-key nudge rather than once per gesture - debounce the
  // actual mutation so dialing in a rating doesn't fire a PATCH (and a
  // duplicate "Rated" feed activity) per intermediate value.
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

  const handleSeasonReviewSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!seasonReviewContent.trim()) {
      setSeasonFormError("Please write a review before saving.");
      return;
    }
    setSeasonFormError(null);
    try {
      await upsertSeasonReviewMutation.mutateAsync({
        content: seasonReviewContent.trim(),
        containsSpoilers: seasonReviewContainsSpoilers,
      });
      setActiveReviewModal(null);
    } catch {
      setSeasonFormError("Failed to save the review. Please try again.");
    }
  };

  const handleSeasonReviewDelete = async () => {
    await deleteSeasonReviewMutation.mutateAsync();
    setActiveReviewModal(null);
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

  const handleEpisodeReviewSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (activeReviewModal?.type !== "episode") return;
    if (!episodeReviewContent.trim()) {
      setEpisodeFormError("Please write a review before saving.");
      return;
    }
    setEpisodeFormError(null);
    try {
      await upsertEpisodeReviewMutation.mutateAsync({
        content: episodeReviewContent.trim(),
        containsSpoilers: episodeReviewContainsSpoilers,
      });
      setActiveReviewModal(null);
    } catch {
      setEpisodeFormError("Failed to save the review. Please try again.");
    }
  };

  const handleEpisodeReviewDelete = async () => {
    if (activeReviewModal?.type !== "episode") return;
    await deleteEpisodeReviewMutation.mutateAsync();
    setActiveReviewModal(null);
  };

  const seasonWatched = season.viewerInteraction?.watched ?? false;
  const seasonLiked = season.viewerInteraction?.liked ?? false;
  const seasonRating = season.viewerInteraction?.rating ?? null;

  return (
    <div
      className="overflow-hidden border"
      style={{
        borderColor: SERIAL_MODULE_STYLES.border,
        background: SERIAL_MODULE_STYLES.panel,
      }}
    >
      <SeasonHeaderRow
        season={season}
        isOpen={isOpen}
        showInteractions={Boolean(user)}
        onToggle={onToggle}
        onToggleWatched={handleSeasonWatchedToggle}
        onToggleLiked={handleSeasonLikedToggle}
        onRatingChange={handleSeasonRatingChange}
        onOpenReview={() => setActiveReviewModal({ type: "season" })}
      />

      {isOpen ? (
        <div
          className="border-t"
          style={{ borderColor: SERIAL_MODULE_STYLES.borderSoft }}
        >
          {seasonDetailQuery.isPending ? (
            <div
              className="px-4 py-3 font-mono text-xs"
              style={{ color: SERIAL_MODULE_STYLES.muted }}
            >
              Loading episodes...
            </div>
          ) : null}

          {seasonDetailQuery.isError ? (
            <div
              className="px-4 py-3 font-mono text-xs text-destructive"
              style={{
                background:
                  "color-mix(in srgb, var(--destructive) 10%, transparent)",
              }}
            >
              Could not load episodes for this season.
            </div>
          ) : null}

          {!seasonDetailQuery.isPending &&
          !seasonDetailQuery.isError &&
          episodes.length === 0 ? (
            <div
              className="px-4 py-3 font-mono text-xs"
              style={{ color: SERIAL_MODULE_STYLES.muted }}
            >
              No episodes available for this season.
            </div>
          ) : null}

          {!seasonDetailQuery.isPending &&
          !seasonDetailQuery.isError &&
          episodes.length > 0
            ? episodes.map((episode, index) => (
                <EpisodeRow
                  key={`episode-${episode.id}`}
                  episode={episode}
                  index={index}
                  showInteractions={Boolean(user)}
                  onToggleWatched={handleEpisodeWatchedToggle}
                  onToggleLiked={handleEpisodeLikedToggle}
                  onRatingChange={handleEpisodeRatingChange}
                  onOpenReview={(episodeNumber, episodeName) =>
                    setActiveReviewModal({ type: "episode", episodeNumber, episodeName })
                  }
                />
              ))
            : null}
        </div>
      ) : null}

      {activeReviewModal?.type === "season" && createPortal(
        <LogMediaDialog
          title={season.name || `Season ${season.seasonNumber}`}
          subtitle="Season Review"
          posterUrl={getPosterUrl(season.posterPath)}
          review={seasonReviewContent}
          onReviewChange={setSeasonReviewContent}
          containsSpoilers={seasonReviewContainsSpoilers}
          onContainsSpoilersChange={setSeasonReviewContainsSpoilers}
          rating={seasonRating}
          onRatingChange={handleSeasonRatingChange}
          liked={seasonLiked}
          onLikedChange={handleSeasonLikedChange}
          watched={seasonWatched}
          onWatchedChange={handleSeasonWatchedChange}
          isSubmitting={upsertSeasonReviewMutation.isPending || deleteSeasonReviewMutation.isPending}
          onClose={() => { setActiveReviewModal(null); setSeasonFormError(null); }}
          onSubmit={handleSeasonReviewSubmit}
          onDelete={seasonReviewQuery.data?.content ? handleSeasonReviewDelete : undefined}
          submitLabel="Save"
          formError={seasonFormError}
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
            title={season.name || `Season ${season.seasonNumber}`}
            subtitle={`Episode ${activeReviewModal.episodeNumber}: ${activeReviewModal.episodeName}`}
            posterUrl={getPosterUrl(season.posterPath)}
            review={episodeReviewContent}
            onReviewChange={setEpisodeReviewContent}
            containsSpoilers={episodeReviewContainsSpoilers}
            onContainsSpoilersChange={setEpisodeReviewContainsSpoilers}
            rating={epRating}
            onRatingChange={(nextRating) => handleEpisodeRatingChange(activeReviewModal.episodeNumber, nextRating)}
            liked={epLiked}
            onLikedChange={(nextLiked) => handleEpisodeLikedChange(activeReviewModal.episodeNumber, nextLiked)}
            watched={epWatched}
            onWatchedChange={(nextWatched) => handleEpisodeWatchedChange(activeReviewModal.episodeNumber, nextWatched)}
            isSubmitting={upsertEpisodeReviewMutation.isPending || deleteEpisodeReviewMutation.isPending}
            onClose={() => { setActiveReviewModal(null); setEpisodeFormError(null); }}
            onSubmit={handleEpisodeReviewSubmit}
            onDelete={episodeReviewQuery.data?.content ? handleEpisodeReviewDelete : undefined}
            submitLabel="Save"
            formError={episodeFormError}
            reviewMaxLength={10000}
            reviewPlaceholder="Share your thoughts about this episode..."
          />,
          document.body,
        );
      })()}
    </div>
  );
};
