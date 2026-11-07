import type { SeriesDetailResponse } from "@/features/tv/api";
import { buildSeriesFactRows } from "@/features/tv/components/series-detail/facts";
import { MediaDetailsMainSection } from "@/features/media/detail/MediaDetailsMainSection";
import { SERIES_MODULE_STYLES } from "@/features/media/styles";
import { toDateLabel } from "@/features/tv/components/series-detail/utils";
import type { ReactNode } from "react";
import { formatEpisodeRuntimeLabel } from "@/features/tv/components/utils";
import { getPosterUrl } from "@/features/media/tmdb-images";

type SeriesDetailsMainSectionProps = {
  detail: SeriesDetailResponse;
  actionsSlot?: ReactNode;
};

export const SeriesDetailsMainSection = ({
  detail,
  actionsSlot,
}: SeriesDetailsMainSectionProps) => {
  const series = detail.series;

  const firstAirDateLabel = toDateLabel(series.firstAirDate);
  const lastAirDateLabel = toDateLabel(series.lastAirDate);

  const communityRatingLabel =
    detail.ratingBreakdown.averageRating !== null
      ? detail.ratingBreakdown.averageRating.toFixed(1)
      : "--";

  const tmdbRatingLabel =
    series.globalRating !== null ? series.globalRating.toFixed(1) : "--";

  const factRows = buildSeriesFactRows(detail, firstAirDateLabel, lastAirDateLabel);

  return (
    <MediaDetailsMainSection
      moduleStyles={SERIES_MODULE_STYLES}
      title={series.title}
      tagline={series.tagline}
      genres={series.genres}
      creditRoleLabel="Created by"
      creditPeople={series.creators}
      communityRatingLabel={communityRatingLabel}
      logsCount={detail.logsCount}
      tmdbRatingLabel={tmdbRatingLabel}
      overview={series.overview ?? ""}
      overviewFallback="No synopsis is available for this series."
      cast={series.cast}
      factRows={factRows}
      ratingBuckets={detail.ratingBreakdown.buckets}
      posterUrl={series.posterPath ? getPosterUrl(series.posterPath) : null}
      runtimeLabel={formatEpisodeRuntimeLabel(series.episodeRuntime)}
      actionsSlot={actionsSlot}
    />
  );
};
