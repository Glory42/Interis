import type { MovieArchiveInput, MovieDetailInput } from "./types";

export const normalizeSearchQuery = (query: string): string => query.trim();

const toClampedPositiveInt = (value: number): number => Math.max(1, Math.floor(value));

export const toMovieArchiveSearchParams = (input: MovieArchiveInput): URLSearchParams => {
  const searchParams = new URLSearchParams();

  if (input.genre && input.genre.trim().length > 0) {
    searchParams.set("genre", input.genre.trim());
  }

  if (input.language && input.language.trim().length > 0) {
    searchParams.set("language", input.language.trim());
  }

  if (input.sort) {
    searchParams.set("sort", input.sort);
  }

  if (input.period) {
    searchParams.set("period", input.period);
  }

  if (typeof input.page === "number" && Number.isFinite(input.page)) {
    searchParams.set("page", String(toClampedPositiveInt(input.page)));
  }

  if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
    searchParams.set("limit", String(toClampedPositiveInt(input.limit)));
  }

  return searchParams;
};

export const toMovieDetailSearchParams = (input: MovieDetailInput): URLSearchParams => {
  const searchParams = new URLSearchParams();

  if (input.reviewsSort) {
    searchParams.set("reviewsSort", input.reviewsSort);
  }

  return searchParams;
};
