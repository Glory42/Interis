import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { CircleCheck, CircleDot, CirclePlus, Heart } from "lucide-react";
import {
  type SeriesDetailReviewSort,
  type UpdateSeriesInteractionInput,
} from "@/features/tv/api";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { LogSeriesModal } from "@/features/tv/components/LogSeriesModal";
import { SeriesDetailsMainSection } from "@/features/tv/components/series-detail/SeriesDetailsMainSection";
import { SeriesReviewsSection } from "@/features/tv/components/series-detail/SeriesReviewsSection";
import { SeriesSeasonsSection } from "@/features/tv/components/series-detail/SeriesSeasonsSection";
import { SeriesProgressPanel } from "@/features/tv/components/series-detail/SeriesProgressPanel";
import { SERIES_MODULE_STYLES } from "@/features/media/styles";
import {
  useSeriesDetailView,
  useSeriesInteraction,
  useUpdateSeriesInteraction,
} from "@/features/tv/hooks/useTv";
import { LetterboxHero } from "@/features/media/detail/LetterboxHero";
import { logTriggerProps } from "@/features/media/detail/log-trigger";
import { MediaActionCard } from "@/features/media/detail/MediaActionCard";
import { BELOW_MD_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { MediaSimilarSection } from "@/features/media/detail/MediaSimilarSection";
import { MediaDetailStatusPanel } from "@/features/media/detail/MediaDetailStatusPanel";
import { MediaDetailSkeleton } from "@/components/ui/PageSkeletons";
import {
  MediaActionsSidebar,
  type MediaAction,
} from "@/features/media/detail/MediaActionsSidebar";
import { MediaReviewChooser } from "@/features/media/detail/MediaReviewChooser";
import { useReviewChooser } from "@/features/reviews/hooks/useReviewChooser";
import { getBackdropUrl, getPosterUrl } from "@/features/media/tmdb-images";
import { toLanguageLabel as toSeriesLanguageLabel } from "@/features/media/labels";

type SeriesDetailPageProps = {
  tmdbId: number;
};

export const SeriesDetailPage = ({ tmdbId }: SeriesDetailPageProps) => {
  const isValidTmdbId = Number.isInteger(tmdbId) && tmdbId > 0;
  const [reviewsSort, setReviewsSort] =
    useState<SeriesDetailReviewSort>("popular");
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
  const isBelowMd = useMediaQuery(BELOW_MD_QUERY);

  if (!isValidTmdbId) {
    return (
      <MediaDetailStatusPanel
        message="Invalid series id."
        moduleStyles={SERIES_MODULE_STYLES}
      />
    );
  }

  if (detailQuery.isPending) {
    return <MediaDetailSkeleton label="Loading show" />;
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <MediaDetailStatusPanel
        message="Could not load this series right now."
        moduleStyles={SERIES_MODULE_STYLES}
      />
    );
  }

  const detail = detailQuery.data;
  const series = detail.series;
  const backdropUrl = series.backdropPath
    ? getBackdropUrl(series.backdropPath)
    : null;

  const resolvedOpenSeasonNumber =
    openSeasonNumber === undefined
      ? (series.seasons[0]?.seasonNumber ?? null)
      : openSeasonNumber;

  const watchlisted = interactionQuery.data?.watchlisted ?? false;
  const liked = interactionQuery.data?.liked ?? false;
  const watched = interactionQuery.data?.watched ?? false;
  const interactionRating = interactionQuery.data?.rating ?? null;
  const currentRating = interactionRating ?? detail.userRating?.rating ?? null;
  // Only gate on the initial load - once loaded, toggles apply optimistically
  // and shouldn't visually lock while the (TMDB-backed, sometimes
  // multi-second) cascade request is still in flight in the background.
  const isInteractionBusy = interactionQuery.isPending;

  const modalInitialState = {
    rating: currentRating,
    rewatch: Boolean(detail.userRating?.diaryEntryId),
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
    watchStatus: NonNullable<UpdateSeriesInteractionInput["watchStatus"]>,
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

  const actions: MediaAction[] = [
    {
      key: "watched",
      isActive: watched,
      activeIcon: <CircleDot />,
      inactiveIcon: <CircleDot />,
      activeLabel: "Watched",
      inactiveLabel: "Watch",
      onToggle: handleToggleWatched,
    },
    {
      key: "liked",
      isActive: liked,
      activeIcon: <Heart className="fill-current" />,
      inactiveIcon: <Heart />,
      activeLabel: "Liked",
      inactiveLabel: "Like",
      onToggle: handleToggleLike,
    },
    {
      key: "watchlist",
      isActive: watchlisted,
      activeIcon: <CircleCheck />,
      inactiveIcon: <CirclePlus />,
      activeLabel: "Watchlisted",
      inactiveLabel: "Watchlist",
      onToggle: handleToggleWatchlist,
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

  const actionCard = (
    <>
      <MediaActionCard
        moduleStyles={SERIES_MODULE_STYLES}
        logSlot={
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
            {...logTriggerProps(Boolean(detail.userRating?.watchedDate))}
          />
        }
        tmdbId={series.tmdbId}
        itemType="serial"
        viewerUsername={user?.username ?? null}
        lastWatchedDate={detail.userRating?.watchedDate ?? null}
        currentRating={currentRating}
        onRatingChange={handleRatingChange}
        isRatingSaving={updateInteractionMutation.isPending}
        isAuthenticated={Boolean(user)}
        isInteractionBusy={isInteractionBusy}
        actions={actions}
      />
      {user && detail.viewerTracking ? (
        <SeriesProgressPanel
          tracking={detail.viewerTracking}
          numberOfEpisodes={series.numberOfEpisodes}
          watchStatus={interactionQuery.data?.watchStatus ?? null}
          isStatusSaving={updateInteractionMutation.isPending}
          onWatchStatusChange={handleWatchStatusChange}
        />
      ) : null}
    </>
  );

  return (
    <div className="min-h-screen">
      <LetterboxHero
        backdropUrl={backdropUrl}
        slateLeft={[
          "Interis",
          "TV",
          ...(series.firstAirYear
            ? [
                series.lastAirDate && !series.inProduction
                  ? `${series.firstAirYear}–${series.lastAirDate.slice(0, 4)}`
                  : `${series.firstAirYear}–`,
              ]
            : []),
        ]}
        slateRight={[
          series.network,
          toSeriesLanguageLabel(series.languageCode),
        ].filter((part): part is string => Boolean(part))}
      />

      <main className="relative z-10 mx-auto -mt-20 w-full max-w-5xl px-4 pb-10 sm:-mt-28">
        <Link
          to="/serials"
          className="mb-4 inline-flex items-center gap-1.5 font-mono text-[11px]"
          style={{ color: SERIES_MODULE_STYLES.muted }}
          viewTransition
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>TV</span>
        </Link>

        <div className="grid grid-cols-1 gap-10 md:grid-cols-[220px_1fr]">
          <MediaActionsSidebar
            moduleStyles={SERIES_MODULE_STYLES}
            posterSlot={
              <img
                src={getPosterUrl(series.posterPath)}
                alt={`${series.title} poster`}
                className="h-full w-full object-cover"
              />
            }
          >
            {isBelowMd ? null : actionCard}
          </MediaActionsSidebar>

          <SeriesDetailsMainSection detail={detail} actionsSlot={isBelowMd ? actionCard : null} />
        </div>

        <MediaReviewChooser
          chooser={reviewChooser}
          title={{ mediaType: "tv", tmdbId: series.tmdbId, title: series.title }}
        />

        <SeriesReviewsSection
          key={reviewsSort}
          tmdbId={series.tmdbId}
          reviewsSort={reviewsSort}
          onSortChange={setReviewsSort}
          reviews={detail.reviews}
          reviewsLimit={detail.reviewsLimit}
          reviewsHasMore={detail.reviewsHasMore}
        />

        <SeriesSeasonsSection
          series={series}
          tracking={detail.viewerTracking}
          resolvedOpenSeasonNumber={resolvedOpenSeasonNumber}
          onToggleSeason={handleToggleSeason}
        />

        <MediaSimilarSection
          heading="Similar Shows"
          items={detail.similar.map((item) => ({
            ...item,
            year: item.firstAirYear,
          }))}
          moduleStyles={SERIES_MODULE_STYLES}
          getPosterUrl={getPosterUrl}
          detailRoute="/serials/$tmdbId"
        />
      </main>
    </div>
  );
};
