import type {
  ArchiveGenre,
  CinemaArchiveFeaturedMovie,
  CinemaArchiveItem,
} from "../types/movies.types";

export const toReleaseTimestamp = (
  releaseDate: string | null,
  releaseYear: number | null,
): number => {
  if (releaseDate) {
    const parsed = Date.parse(releaseDate);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  if (releaseYear !== null && Number.isFinite(releaseYear)) {
    return Date.UTC(releaseYear, 0, 1);
  }

  return Number.NEGATIVE_INFINITY;
};

export const normalizeMovieGenres = (rawGenres: unknown): ArchiveGenre[] => {
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
    .filter((genre): genre is ArchiveGenre => genre !== null);
};

export const compareByReleaseDesc = (
  left: CinemaArchiveItem,
  right: CinemaArchiveItem,
): number => {
  return (
    toReleaseTimestamp(right.releaseDate, right.releaseYear) -
    toReleaseTimestamp(left.releaseDate, left.releaseYear)
  );
};

export const compareByReleaseAsc = (
  left: CinemaArchiveItem,
  right: CinemaArchiveItem,
): number => {
  const leftTimestamp = toReleaseTimestamp(left.releaseDate, left.releaseYear);
  const rightTimestamp = toReleaseTimestamp(right.releaseDate, right.releaseYear);

  const leftMissingRelease = leftTimestamp === Number.NEGATIVE_INFINITY;
  const rightMissingRelease = rightTimestamp === Number.NEGATIVE_INFINITY;

  if (leftMissingRelease && !rightMissingRelease) {
    return 1;
  }

  if (!leftMissingRelease && rightMissingRelease) {
    return -1;
  }

  if (leftTimestamp !== rightTimestamp) {
    return leftTimestamp - rightTimestamp;
  }

  return left.title.localeCompare(right.title);
};

export const toFeaturedMovie = (
  items: CinemaArchiveItem[],
): CinemaArchiveFeaturedMovie | null => {
  const featuredMovie = [...items].sort(compareByReleaseDesc)[0] ?? null;

  if (!featuredMovie) {
    return null;
  }

  return {
    tmdbId: featuredMovie.tmdbId,
    title: featuredMovie.title,
    posterPath: featuredMovie.posterPath,
    backdropPath: featuredMovie.backdropPath,
    releaseDate: featuredMovie.releaseDate,
    releaseYear: featuredMovie.releaseYear,
    director: featuredMovie.director,
  };
};

export const toRatingOutOfFive = (ratingOutOfTen: number | null): number | null => {
  if (ratingOutOfTen === null || !Number.isFinite(ratingOutOfTen)) {
    return null;
  }

  return Math.max(0, Math.min(5, ratingOutOfTen / 2));
};

export const toRatingBreakdownBucket = (ratingOutOfTen: number): 1 | 2 | 3 | 4 | 5 => {
  const normalized = Math.round(Math.max(1, Math.min(10, ratingOutOfTen)) / 2);
  return Math.max(1, Math.min(5, normalized)) as 1 | 2 | 3 | 4 | 5;
};

export const toTmdbReleaseDate = (rawReleaseDate: string): string | null => {
  if (!rawReleaseDate || !/^\d{4}-\d{2}-\d{2}$/.test(rawReleaseDate)) {
    return null;
  }

  return rawReleaseDate;
};

export const toTmdbReleaseYear = (releaseDate: string | null): number | null => {
  if (!releaseDate) {
    return null;
  }

  const parsed = Number.parseInt(releaseDate.slice(0, 4), 10);
  return Number.isNaN(parsed) ? null : parsed;
};
