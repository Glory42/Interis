import { apiRequest } from "@/lib/api-client";
import {
  filmArchiveResponseSchema,
  filmDetailResponseSchema,
  filmLogsResponseSchema,
  filmReviewsPageResponseSchema,
  filmSchema,
  filmSearchResponseSchema,
} from "./schemas";
import {
  normalizeSearchQuery,
  toFilmArchiveSearchParams,
  toFilmDetailSearchParams,
  toFilmReviewsSearchParams,
} from "./mappers";
import type {
  Film,
  FilmArchiveInput,
  FilmArchiveResponse,
  FilmDetailInput,
  FilmDetailResponse,
  FilmLog,
  FilmReviewsInput,
  FilmReviewsPageResponse,
  QueryRequestOptions,
  TmdbSearchFilm,
} from "./types";

export const searchFilms = async (
  query: string,
  options: QueryRequestOptions = {},
): Promise<TmdbSearchFilm[]> => {
  const normalizedQuery = normalizeSearchQuery(query);
  if (normalizedQuery.length === 0) {
    return [];
  }

  const response = await apiRequest<unknown>(
    `/api/movies/search?query=${encodeURIComponent(normalizedQuery)}`,
    { method: "GET", signal: options.signal },
  );

  return filmSearchResponseSchema.parse(response);
};

export const getFilmByTmdbId = async (
  tmdbId: number,
  options: QueryRequestOptions = {},
): Promise<Film> => {
  const response = await apiRequest<unknown>(`/api/movies/${tmdbId}`, {
    method: "GET",
    signal: options.signal,
  });

  return filmSchema.parse(response);
};

export const getRecentFilms = async (
  options: QueryRequestOptions = {},
): Promise<TmdbSearchFilm[]> => {
  const response = await apiRequest<unknown>("/api/movies/recent", {
    method: "GET",
    signal: options.signal,
  });

  return filmSearchResponseSchema.parse(response);
};

export const getFilmLogs = async (
  tmdbId: number,
  options: QueryRequestOptions = {},
): Promise<FilmLog[]> => {
  const response = await apiRequest<unknown>(`/api/movies/${tmdbId}/logs`, {
    method: "GET",
    signal: options.signal,
  });

  return filmLogsResponseSchema.parse(response);
};

export const getFilmArchive = async (
  input: FilmArchiveInput,
  options: QueryRequestOptions = {},
): Promise<FilmArchiveResponse> => {
  const query = toFilmArchiveSearchParams(input).toString();
  const path = query ? `/api/movies/archive?${query}` : "/api/movies/archive";

  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });

  return filmArchiveResponseSchema.parse(response);
};

export const getFilmDetail = async (
  tmdbId: number,
  input: FilmDetailInput = {},
  options: QueryRequestOptions = {},
): Promise<FilmDetailResponse> => {
  const query = toFilmDetailSearchParams(input).toString();
  const path = query
    ? `/api/movies/${tmdbId}/detail?${query}`
    : `/api/movies/${tmdbId}/detail`;

  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });

  return filmDetailResponseSchema.parse(response);
};

export const getFilmReviews = async (
  tmdbId: number,
  input: FilmReviewsInput = {},
  options: QueryRequestOptions = {},
): Promise<FilmReviewsPageResponse> => {
  const query = toFilmReviewsSearchParams(input).toString();
  const path = query
    ? `/api/movies/${tmdbId}/reviews?${query}`
    : `/api/movies/${tmdbId}/reviews`;

  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });

  return filmReviewsPageResponseSchema.parse(response);
};
