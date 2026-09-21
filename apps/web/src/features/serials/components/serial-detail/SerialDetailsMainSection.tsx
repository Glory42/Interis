import type { SerialDetailResponse } from "@/features/serials/api";
import { buildSerialFactRows } from "@/features/serials/components/serial-detail/facts";
import { MediaDetailsMainSection } from "@/features/media/detail/MediaDetailsMainSection";
import { SERIAL_MODULE_STYLES } from "@/features/media/styles";
import { toDateLabel } from "@/features/serials/components/serial-detail/utils";
import {
  formatEpisodeRuntimeLabel,
  toLanguageLabel,
} from "@/features/serials/components/utils";

type SerialDetailsMainSectionProps = {
  detail: SerialDetailResponse;
};

export const SerialDetailsMainSection = ({
  detail,
}: SerialDetailsMainSectionProps) => {
  const series = detail.series;

  const runtimeLabel = formatEpisodeRuntimeLabel(series.episodeRuntime);
  const languageLabel = toLanguageLabel(series.languageCode);
  const firstAirDateLabel = toDateLabel(series.firstAirDate);
  const lastAirDateLabel = toDateLabel(series.lastAirDate);

  const communityRatingLabel =
    detail.ratingBreakdown.averageRating !== null
      ? detail.ratingBreakdown.averageRating.toFixed(1)
      : "--";

  const tmdbRatingLabel =
    series.globalRating !== null ? series.globalRating.toFixed(1) : "--";

  const factRows = buildSerialFactRows(
    detail,
    runtimeLabel,
    languageLabel,
    firstAirDateLabel,
    lastAirDateLabel,
  );

  return (
    <MediaDetailsMainSection
      moduleStyles={SERIAL_MODULE_STYLES}
      title={series.title}
      yearLabel={series.firstAirYear ?? "Unknown"}
      genres={series.genres}
      creditRoleLabel="created by "
      creditPeople={series.creators}
      creditFallbackName={series.creator ?? "Unknown"}
      communityRatingLabel={communityRatingLabel}
      logsCount={detail.logsCount}
      tmdbRatingLabel={tmdbRatingLabel}
      overview={series.overview ?? ""}
      overviewFallback="No synopsis is available for this series."
      cast={series.cast}
      factRows={factRows}
      ratingBuckets={detail.ratingBreakdown.buckets}
    />
  );
};
