import type { SerialArchiveItem } from "@/features/serials/api";
import type { ArchiveRatingSource } from "@/features/media/types";
export const getFirstAirYearLabel = (series: SerialArchiveItem): string => {
  if (series.firstAirYear !== null) {
    return String(series.firstAirYear);
  }

  if (series.firstAirDate && series.firstAirDate.length >= 4) {
    return series.firstAirDate.slice(0, 4);
  }

  return "Year unknown";
};

export const getCreatorYearLine = (series: SerialArchiveItem): string => {
  const creator = series.creator ?? "Unknown creator";
  return `${creator} · ${getFirstAirYearLabel(series)}`;
};

export const getRating = (
  series: SerialArchiveItem,
  ratingSource: ArchiveRatingSource,
): number | null => {
  const ratingOutOfTen =
    ratingSource === "tmdb" ? series.tmdbRatingOutOfTen : series.avgRatingOutOfTen;

  return ratingOutOfTen;
};

export const getRoundedStars = (rating: number | null): number => {
  if (rating === null) {
    return 0;
  }

  return Math.max(0, Math.min(10, Math.round(rating)));
};

export const getSeriesStateLabel = (
  series: SerialArchiveItem,
): "Watched" | "Watching" | "Queued" | null => {
  if (series.viewerFullyWatched) {
    return "Watched";
  }

  if (series.viewerHasProgress) {
    return "Watching";
  }

  if (series.viewerWatchlisted) {
    return "Queued";
  }

  return null;
};
