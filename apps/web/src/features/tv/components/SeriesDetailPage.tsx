import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { type SeriesDetailReviewSort } from "@/features/tv/api";
import { SeriesDetailsMainSection } from "@/features/tv/components/series-detail/SeriesDetailsMainSection";
import { SeriesReviewsSection } from "@/features/tv/components/series-detail/SeriesReviewsSection";
import { SeriesSeasonsSection } from "@/features/tv/components/series-detail/SeriesSeasonsSection";
import { SeriesProgressPanel } from "@/features/tv/components/series-detail/SeriesProgressPanel";
import { SERIES_MODULE_STYLES } from "@/features/media/styles";
import { useSeriesDetailView } from "@/features/tv/hooks/useTv";
import { LetterboxHero } from "@/features/media/detail/LetterboxHero";
import { MediaDetailActionCard } from "@/features/media/detail/MediaDetailActionCard";
import { MediaDetailFallback } from "@/features/media/detail/MediaDetailFallback";
import { isValidTmdbId, useMediaDetail } from "@/features/media/detail/use-media-detail";
import { BELOW_MD_QUERY, useMediaQuery } from "@/lib/use-media-query";
import { MediaSimilarSection } from "@/features/media/detail/MediaSimilarSection";
import { MediaActionsSidebar } from "@/features/media/detail/MediaActionsSidebar";
import { getBackdropUrl, getPosterUrl } from "@/features/media/tmdb-images";
import { toLanguageLabel as toSeriesLanguageLabel } from "@/features/media/labels";

type SeriesDetailPageProps = {
  tmdbId: number;
};

export const SeriesDetailPage = ({ tmdbId }: SeriesDetailPageProps) => {
  const isValidId = isValidTmdbId(tmdbId);
  const [reviewsSort, setReviewsSort] =
    useState<SeriesDetailReviewSort>("popular");
  const [openSeasonNumber, setOpenSeasonNumber] = useState<
    number | null | undefined
  >(undefined);

  const detailQuery = useSeriesDetailView(tmdbId, reviewsSort, isValidId);
  const mediaDetail = useMediaDetail("tv", tmdbId, detailQuery.data?.userRating);
  const isBelowMd = useMediaQuery(BELOW_MD_QUERY);

  if (!isValidId || detailQuery.isError || !detailQuery.data) {
    return <MediaDetailFallback kind="tv" isValidId={isValidId} isPending={detailQuery.isPending} />;
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
      <MediaDetailActionCard
        media={{
          kind: "tv",
          tmdbId: series.tmdbId,
          title: series.title,
          year: series.firstAirYear,
          posterPath: series.posterPath,
        }}
        userRating={detail.userRating}
        moduleStyles={SERIES_MODULE_STYLES}
        state={mediaDetail}
      />
      {mediaDetail.isAuthenticated && detail.viewerTracking ? (
        <SeriesProgressPanel
          tracking={detail.viewerTracking}
          numberOfEpisodes={series.numberOfEpisodes}
          watchStatus={mediaDetail.watchStatus}
          isStatusSaving={mediaDetail.isSaving}
          onWatchStatusChange={mediaDetail.setWatchStatus}
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
