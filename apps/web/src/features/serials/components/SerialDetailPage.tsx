import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { Check, Heart, Plus } from "lucide-react";
import {
  type SerialDetailReviewSort,
  type UpdateSerialInteractionInput,
} from "@/features/serials/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LogSeriesModal } from "@/features/serials/components/LogSeriesModal";
import { SerialDetailsMainSection } from "@/features/serials/components/serial-detail/SerialDetailsMainSection";
import { SerialReviewsSection } from "@/features/serials/components/serial-detail/SerialReviewsSection";
import { SerialSeasonsSection } from "@/features/serials/components/serial-detail/SerialSeasonsSection";
import { SerialProgressPanel } from "@/features/serials/components/serial-detail/SerialProgressPanel";
import { SERIAL_MODULE_STYLES } from "@/features/media/styles";
import { getBackdropUrl, getPosterUrl } from "@/features/serials/components/utils";
import {
  serialKeys,
  useSeriesDetailView,
  useSeriesInteraction,
  useUpdateSeriesInteraction,
} from "@/features/serials/hooks/useSerials";
import { MediaDetailBackdrop } from "@/features/media/detail/MediaDetailBackdrop";
import { MediaSimilarSection } from "@/features/media/detail/MediaSimilarSection";
import { MediaDetailStatusPanel } from "@/features/media/detail/MediaDetailStatusPanel";
import { MediaActionsSidebar, type MediaAction } from "@/features/media/detail/MediaActionsSidebar";
import { MediaReviewChooser } from "@/features/media/detail/MediaReviewChooser";
import { useReviewChooser } from "@/features/reviews/hooks/useReviewChooser";

type SerialDetailPageProps = {
  tmdbId: number;
};

export const SerialDetailPage = ({ tmdbId }: SerialDetailPageProps) => {
  const isValidTmdbId = Number.isInteger(tmdbId) && tmdbId > 0;
  const [reviewsSort, setReviewsSort] =
    useState<SerialDetailReviewSort>("popular");
  const [openSeasonNumber, setOpenSeasonNumber] = useState<
    number | null | undefined
  >(undefined);

  const detailQuery = useSeriesDetailView(tmdbId, reviewsSort, isValidTmdbId);

  const { user } = useAuth();
  const interactionQuery = useSeriesInteraction(
    tmdbId,
    Boolean(user) && isValidTmdbId,
  );
  const updateInteractionMutation = useUpdateSeriesInteraction(tmdbId);
  const reviewChooser = useReviewChooser();
  const queryClient = useQueryClient();

  if (!isValidTmdbId) {
    return <MediaDetailStatusPanel message="Invalid series id." moduleStyles={SERIAL_MODULE_STYLES} />;
  }

  if (detailQuery.isPending) {
    return <MediaDetailStatusPanel message="Loading..." moduleStyles={SERIAL_MODULE_STYLES} loading />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return <MediaDetailStatusPanel message="Could not load this series right now." moduleStyles={SERIAL_MODULE_STYLES} />;
  }

  const detail = detailQuery.data;
  const series = detail.series;
  const backdropUrl = series.backdropPath ? getBackdropUrl(series.backdropPath) : null;

  const resolvedOpenSeasonNumber =
    openSeasonNumber === undefined
      ? (series.seasons[0]?.seasonNumber ?? null)
      : openSeasonNumber;

  const watchlisted = interactionQuery.data?.watchlisted ?? false;
  const liked = interactionQuery.data?.liked ?? false;
  const watched = interactionQuery.data?.watched ?? false;
  const interactionRating = interactionQuery.data?.rating ?? null;
  const currentRating =
    interactionRating ?? detail.userRating?.rating ?? null;
  // Only gate on the initial load - once loaded, toggles apply optimistically
  // and shouldn't visually lock while the (TMDB-backed, sometimes
  // multi-second) cascade request is still in flight in the background.
  const isInteractionBusy = interactionQuery.isPending;

  const modalInitialState = {
    rating: currentRating,
    rewatch: Boolean(detail.userRating?.diaryEntryId),
  };

  const handleReviewEdited = () => {
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: serialKeys.detailViewRoot(tmdbId) }),
      queryClient.invalidateQueries({ queryKey: serialKeys.logs(tmdbId) }),
      queryClient.invalidateQueries({ queryKey: serialKeys.myLogs }),
    ]);
  };

  const handleToggleWatchlist = () => {
    void updateInteractionMutation.mutateAsync({ watchlisted: !watchlisted });
  };

  const handleToggleLike = () => {
    void updateInteractionMutation.mutateAsync({ liked: !liked });
  };

  const handleToggleWatched = () => {
    void updateInteractionMutation.mutateAsync({ watched: !watched });
  };

  const handleWatchStatusChange = (
    watchStatus: NonNullable<UpdateSerialInteractionInput["watchStatus"]>,
  ) => {
    void updateInteractionMutation.mutateAsync({ watchStatus });
  };

  const handleRatingChange = (nextRating: number | null) => {
    if (!user || nextRating === currentRating) {
      return;
    }

    void updateInteractionMutation.mutateAsync({
      rating: nextRating,
    });
  };

  const actions: [MediaAction, ...MediaAction[]] = [
    {
      key: "watchlist",
      isActive: watchlisted,
      activeIcon: <Check className="h-3 w-3" />,
      inactiveIcon: <Plus className="h-3 w-3" />,
      activeLabel: "watchlisted",
      inactiveLabel: "watchlist",
      loginLabel: "Queue",
      onToggle: handleToggleWatchlist,
    },
    {
      key: "watched",
      isActive: watched,
      activeIcon: <Check className="h-3 w-3" />,
      inactiveIcon: <Check className="h-3 w-3" />,
      activeLabel: "Watched",
      inactiveLabel: "Watch",
      loginLabel: "Watch",
      onToggle: handleToggleWatched,
    },
    {
      key: "liked",
      isActive: liked,
      activeIcon: <Heart className="h-3 w-3" />,
      inactiveIcon: <Heart className="h-3 w-3" />,
      activeLabel: "Liked",
      inactiveLabel: "Like",
      loginLabel: "Like",
      onToggle: handleToggleLike,
    },
  ];

  const handleToggleSeason = (seasonNumber: number) => {
    setOpenSeasonNumber((currentSeasonNumber) => {
      const currentResolvedSeasonNumber =
        currentSeasonNumber === undefined
          ? (series.seasons[0]?.seasonNumber ?? null)
          : currentSeasonNumber;

      if (currentResolvedSeasonNumber === seasonNumber) {
        return null;
      }

      return seasonNumber;
    });
  };

  return (
    <div className="min-h-screen">
      <div className="relative h-[42vh] max-h-135 min-h-80 w-full overflow-hidden">
        <MediaDetailBackdrop backdropUrl={backdropUrl} accentColor={SERIAL_MODULE_STYLES.accent} />
      </div>

      <main className="relative z-10 mx-auto -mt-20 w-full max-w-5xl px-4 pb-10 sm:-mt-28">
        <Link
          to="/serials"
          className="mb-4 inline-flex items-center gap-1.5 font-mono text-[11px]"
          style={{ color: SERIAL_MODULE_STYLES.muted }}
          viewTransition
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Serials</span>
        </Link>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
          <MediaActionsSidebar
            moduleStyles={SERIAL_MODULE_STYLES}
            posterSlot={
              <img
                src={getPosterUrl(series.posterPath)}
                alt={`${series.title} poster`}
                className="h-full w-full object-cover"
              />
            }
            logModalSlot={
              <LogSeriesModal
                tmdbId={series.tmdbId}
                seriesTitle={series.title}
                seriesFirstAirYear={series.firstAirYear}
                seriesPosterPath={series.posterPath}
                initialState={modalInitialState}
                onRequestOpen={(openLog) =>
                  reviewChooser.start({ mediaType: "tv", tmdbId: series.tmdbId }, openLog)
                }
                isTriggerBusy={reviewChooser.isChecking}
                triggerVariant="outline"
                triggerLabel="Log"
                triggerClassName="h-auto rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em]"
                triggerContent={
                  <>
                    <Check className="h-3 w-3" />
                    <span>Log</span>
                  </>
                }
              />
            }
            tmdbId={series.tmdbId}
            itemType="serial"
            currentRating={currentRating}
            isRatingSaving={updateInteractionMutation.isPending}
            onRatingChange={handleRatingChange}
            isAuthenticated={Boolean(user)}
            isInteractionBusy={isInteractionBusy}
            actions={actions}
            trailingSlot={
              Boolean(user) && detail.viewerTracking ? (
                <SerialProgressPanel
                  tracking={detail.viewerTracking}
                  numberOfEpisodes={series.numberOfEpisodes}
                  watchStatus={interactionQuery.data?.watchStatus ?? null}
                  isStatusSaving={updateInteractionMutation.isPending}
                  onWatchStatusChange={handleWatchStatusChange}
                />
              ) : undefined
            }
          />

          <SerialDetailsMainSection detail={detail} />
        </div>

        <MediaReviewChooser chooser={reviewChooser} onReviewEdited={handleReviewEdited} />

        <SerialReviewsSection
          key={reviewsSort}
          tmdbId={series.tmdbId}
          reviewsSort={reviewsSort}
          onSortChange={setReviewsSort}
          reviews={detail.reviews}
          reviewsLimit={detail.reviewsLimit}
          reviewsHasMore={detail.reviewsHasMore}
        />

        <SerialSeasonsSection
          tmdbId={series.tmdbId}
          seasons={series.seasons}
          resolvedOpenSeasonNumber={resolvedOpenSeasonNumber}
          onToggleSeason={handleToggleSeason}
        />

        <MediaSimilarSection
          heading="Similar Shows"
          items={detail.similar.map((item) => ({ ...item, year: item.firstAirYear }))}
          moduleStyles={SERIAL_MODULE_STYLES}
          getPosterUrl={getPosterUrl}
          detailRoute="/serials/$tmdbId"
        />
      </main>
    </div>
  );
};
