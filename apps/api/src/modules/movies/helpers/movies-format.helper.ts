import type {
  ArchiveGenre,
  CinemaArchiveFeaturedMovie,
  CinemaArchiveItem,
} from "../types/movies.types";
import {
  compareMediaTimestampsAsc,
  normalizeGenres,
  toMediaTimestamp,
} from "../../media/helpers/media-format.helper";

export const toReleaseTimestamp = (
  releaseDate: string | null,
  releaseYear: number | null,
): number => toMediaTimestamp(releaseDate, releaseYear);

export const normalizeMovieGenres = (rawGenres: unknown): ArchiveGenre[] =>
  normalizeGenres<ArchiveGenre>(rawGenres);

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
  return compareMediaTimestampsAsc(
    toReleaseTimestamp(left.releaseDate, left.releaseYear),
    toReleaseTimestamp(right.releaseDate, right.releaseYear),
    left.title,
    right.title,
  );
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
