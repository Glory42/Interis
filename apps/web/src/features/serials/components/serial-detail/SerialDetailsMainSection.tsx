import type { SerialDetailResponse } from "@/features/serials/api";
import { buildSerialFactRows } from "@/features/serials/components/serial-detail/facts";
import { MediaDetailsMainSection } from "@/features/media/detail/MediaDetailsMainSection";
import { SERIAL_MODULE_STYLES } from "@/features/media/styles";
import { toDateLabel } from "@/features/serials/components/serial-detail/utils";
import type { ReactNode } from "react";
import { formatEpisodeRuntimeLabel } from "@/features/serials/components/utils";
import { getPosterUrl } from "@/features/media/tmdb-images";

type SerialDetailsMainSectionProps = {
  detail: SerialDetailResponse;
  actionsSlot?: ReactNode;
};

export const SerialDetailsMainSection = ({
  detail,
  actionsSlot,
}: SerialDetailsMainSectionProps) => {
  const series = detail.series;

  const firstAirDateLabel = toDateLabel(series.firstAirDate);
  const lastAirDateLabel = toDateLabel(series.lastAirDate);

  const communityRatingLabel =
    detail.ratingBreakdown.averageRating !== null
      ? detail.ratingBreakdown.averageRating.toFixed(1)
      : "--";

  const tmdbRatingLabel =
    series.globalRating !== null ? series.globalRating.toFixed(1) : "--";

  const factRows = buildSerialFactRows(detail, firstAirDateLabel, lastAirDateLabel);

  return (
    <MediaDetailsMainSection
      moduleStyles={SERIAL_MODULE_STYLES}
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
