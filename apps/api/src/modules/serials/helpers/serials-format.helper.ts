import type {
  SerialArchiveFeaturedItem,
  SerialArchiveItem,
  SerialGenre,
} from "../types/serials.types";

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
): number => {
  if (firstAirDate) {
    const parsed = Date.parse(firstAirDate);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  if (firstAirYear !== null && Number.isFinite(firstAirYear)) {
    return Date.UTC(firstAirYear, 0, 1);
  }

  return Number.NEGATIVE_INFINITY;
};

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
  const leftTimestamp = toFirstAirTimestamp(left.firstAirDate, left.firstAirYear);
  const rightTimestamp = toFirstAirTimestamp(right.firstAirDate, right.firstAirYear);

  const leftMissing = leftTimestamp === Number.NEGATIVE_INFINITY;
  const rightMissing = rightTimestamp === Number.NEGATIVE_INFINITY;

  if (leftMissing && !rightMissing) {
    return 1;
  }

  if (!leftMissing && rightMissing) {
    return -1;
  }

  if (leftTimestamp !== rightTimestamp) {
    return leftTimestamp - rightTimestamp;
  }

  return left.title.localeCompare(right.title);
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

export const normalizeSeriesGenres = (rawGenres: unknown): SerialGenre[] => {
  if (!Array.isArray(rawGenres)) {
    return [];
  }

  return rawGenres
    .map((genre) => {
      if (!genre || typeof genre !== "object") {
        return null;
      }

      const maybeId = (genre as { id?: unknown }).id;
      const maybeName = (genre as { name?: unknown }).name;

      if (typeof maybeId !== "number" || typeof maybeName !== "string") {
        return null;
      }

      return {
        id: maybeId,
        name: maybeName,
      };
    })
    .filter((genre): genre is SerialGenre => genre !== null);
};
