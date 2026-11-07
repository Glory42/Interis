import type { SeriesDetailResponse } from "@/features/tv/api";
import type { MediaFactRow } from "@/features/media/detail/MediaDetailsMainSection";

// Runtime, language and network sit on the hero slate; these round out the credits.
export const buildSeriesFactRows = (
  detail: SeriesDetailResponse,
  firstAirDateLabel: string | null,
  lastAirDateLabel: string | null,
): MediaFactRow[] => {
  const series = detail.series;
  const seasons = series.numberOfSeasons ? `${series.numberOfSeasons}` : null;
  const episodes = series.numberOfEpisodes ? `${series.numberOfEpisodes}` : null;

  return [
    {
      label: "Seasons / Episodes",
      value: seasons || episodes ? `${seasons ?? "—"} / ${episodes ?? "—"}` : null,
    },
    { label: "First aired", value: firstAirDateLabel },
    { label: "Last aired", value: series.inProduction ? null : lastAirDateLabel },
    { label: "Status", value: series.status || null },
  ];
};
