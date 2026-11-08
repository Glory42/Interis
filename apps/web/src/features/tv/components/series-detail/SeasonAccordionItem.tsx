import { LineRowsSkeleton, LoadingRegion } from "@/components/ui/PageSkeletons";
import { useEffect, useRef, useState } from "react";
import type { SeriesDetailResponse } from "@/features/tv/api";
import {
  useSeriesSeasonDetail,
  useUpdateSeasonInteraction,
  useUpdateEpisodeInteraction,
  useMarkWatchedThrough,
} from "@/features/tv/hooks/useTv";
import type { MyTitleReview } from "@/features/reviews/api";
import { ReviewChooserDialog } from "@/features/reviews/components/ReviewChooserDialog";
import { useReviewChooser } from "@/features/reviews/hooks/useReviewChooser";
import { useAuth } from "@/features/auth/hooks/useAuth";
import {
  SeasonReviewDialog,
  type SeasonReviewInteraction,
  type SeasonReviewTarget,
} from "@/features/tv/components/series-detail/SeasonReviewDialog";
import { SeasonHeaderRow } from "@/features/tv/components/series-detail/SeasonHeaderRow";
import { EpisodeRow } from "@/features/tv/components/series-detail/EpisodeRow";
import { ReelCells } from "@/components/film/ReelCells";
import { BELOW_MD_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { cn } from "@/lib/utils";

type SeasonAccordionItemProps = {
  tmdbId: number;
  season: SeriesDetailResponse["series"]["seasons"][number];
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
    { target: SeasonReviewTarget; editingReview: MyTitleReview | null } | null
  >(null);
  // The season/episode the review chooser was opened for.
  const [chooserSubject, setChooserSubject] = useState<SeasonReviewTarget | null>(null);
  const reviewChooser = useReviewChooser();

  const updateSeasonInteractionMutation = useUpdateSeasonInteraction(tmdbId);
  const updateEpisodeInteractionMutation = useUpdateEpisodeInteraction(tmdbId, season.seasonNumber);
  const markWatchedThroughMutation = useMarkWatchedThrough(tmdbId, season.seasonNumber);

  const openReviewEditor = (target: SeasonReviewTarget, review: MyTitleReview | null) => {
    setActiveReviewModal({ target, editingReview: review });
  };

  const handleOpenReview = (subject: SeasonReviewTarget) => {
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

  const reviewInteraction = (target: SeasonReviewTarget): SeasonReviewInteraction => {
    if (target.type === "season") {
      return {
        watched: seasonWatched,
        liked: seasonLiked,
        rating: seasonRating,
        onWatchedChange: handleSeasonWatchedChange,
        onLikedChange: handleSeasonLikedChange,
        onRatingChange: handleSeasonRatingChange,
      };
    }
    const { episodeNumber } = target;
    const episodeInteraction = episodes.find((e) => e.episodeNumber === episodeNumber)?.viewerInteraction;
    return {
      watched: episodeInteraction?.watched ?? false,
      liked: episodeInteraction?.liked ?? false,
      rating: episodeInteraction?.rating ?? null,
      onWatchedChange: (nextWatched) => handleEpisodeWatchedChange(episodeNumber, nextWatched),
      onLikedChange: (nextLiked) => handleEpisodeLikedChange(episodeNumber, nextLiked),
      onRatingChange: (nextRating) => handleEpisodeRatingChange(episodeNumber, nextRating),
    };
  };

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

      {activeReviewModal ? (
        <SeasonReviewDialog
          tmdbId={tmdbId}
          season={season}
          target={activeReviewModal.target}
          editingReview={activeReviewModal.editingReview}
          interaction={reviewInteraction(activeReviewModal.target)}
          onClose={() => setActiveReviewModal(null)}
        />
      ) : null}

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
