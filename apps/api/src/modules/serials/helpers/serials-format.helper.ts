import type {
  SerialArchiveFeaturedItem,
  SerialArchiveItem,
  SerialGenre,
} from "../types/serials.types";
import {
  compareMediaTimestampsAsc,
  normalizeGenres,
  toMediaTimestamp,
} from "../../media/helpers/media-format.helper";

export const toFirstAirDate = (rawDate: string | null | undefined): string | null => {
  if (!rawDate || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return null;
  }

  return rawDate;
};

export const toFirstAirYear = (firstAirDate: string | null): number | null => {
  if (!firstAirDate) {
    return null;
  }

  const parsed = Number.parseInt(firstAirDate.slice(0, 4), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

export const toFirstAirTimestamp = (
  firstAirDate: string | null,
  firstAirYear: number | null,
): number => toMediaTimestamp(firstAirDate, firstAirYear);

export const compareByFirstAirDesc = (
  left: SerialArchiveItem,
  right: SerialArchiveItem,
): number => {
  return (
    toFirstAirTimestamp(right.firstAirDate, right.firstAirYear) -
    toFirstAirTimestamp(left.firstAirDate, left.firstAirYear)
  );
};

export const compareByFirstAirAsc = (
  left: SerialArchiveItem,
  right: SerialArchiveItem,
): number => {
  return compareMediaTimestampsAsc(
    toFirstAirTimestamp(left.firstAirDate, left.firstAirYear),
    toFirstAirTimestamp(right.firstAirDate, right.firstAirYear),
    left.title,
    right.title,
  );
};

export const toFeaturedSeries = (
  items: SerialArchiveItem[],
): SerialArchiveFeaturedItem | null => {
  const featuredSeries = [...items].sort(compareByFirstAirDesc)[0] ?? null;

  if (!featuredSeries) {
    return null;
  }

  return {
    tmdbId: featuredSeries.tmdbId,
    title: featuredSeries.title,
    posterPath: featuredSeries.posterPath,
    backdropPath: featuredSeries.backdropPath,
    firstAirDate: featuredSeries.firstAirDate,
    firstAirYear: featuredSeries.firstAirYear,
    creator: featuredSeries.creator,
    network: featuredSeries.network,
  };
};

export const normalizeSeriesGenres = (rawGenres: unknown): SerialGenre[] =>
  normalizeGenres<SerialGenre>(rawGenres);
