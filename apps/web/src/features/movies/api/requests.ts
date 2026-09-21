import { apiRequest } from "@/lib/api-client";
import {
  movieArchiveResponseSchema,
  movieDetailResponseSchema,
  movieLogsResponseSchema,
  movieReviewsPageResponseSchema,
  movieSchema,
  movieSearchResponseSchema,
} from "./schemas";
import {
  normalizeSearchQuery,
  toMovieArchiveSearchParams,
  toMovieDetailSearchParams,
  toMovieReviewsSearchParams,
} from "./mappers";
import type {
  Movie,
  MovieArchiveInput,
  MovieArchiveResponse,
  MovieDetailInput,
  MovieDetailResponse,
  MovieLog,
  MovieReviewsInput,
  MovieReviewsPageResponse,
  QueryRequestOptions,
  TmdbSearchMovie,
} from "./types";

export const searchMovies = async (
  query: string,
  options: QueryRequestOptions = {},
): Promise<TmdbSearchMovie[]> => {
  const normalizedQuery = normalizeSearchQuery(query);
  if (normalizedQuery.length === 0) {
    return [];
  }

  const response = await apiRequest<unknown>(
    `/api/movies/search?query=${encodeURIComponent(normalizedQuery)}`,
    { method: "GET", signal: options.signal },
  );

  return movieSearchResponseSchema.parse(response);
};

export const getMovieByTmdbId = async (
  tmdbId: number,
  options: QueryRequestOptions = {},
): Promise<Movie> => {
  const response = await apiRequest<unknown>(`/api/movies/${tmdbId}`, {
    method: "GET",
    signal: options.signal,
  });

  return movieSchema.parse(response);
};

export const getRecentMovies = async (
  options: QueryRequestOptions = {},
): Promise<TmdbSearchMovie[]> => {
  const response = await apiRequest<unknown>("/api/movies/recent", {
    method: "GET",
    signal: options.signal,
  });

  return movieSearchResponseSchema.parse(response);
};

export const getMovieLogs = async (
  tmdbId: number,
  options: QueryRequestOptions = {},
): Promise<MovieLog[]> => {
  const response = await apiRequest<unknown>(`/api/movies/${tmdbId}/logs`, {
    method: "GET",
    signal: options.signal,
  });

  return movieLogsResponseSchema.parse(response);
};

export const getMovieArchive = async (
  input: MovieArchiveInput,
  options: QueryRequestOptions = {},
): Promise<MovieArchiveResponse> => {
  const query = toMovieArchiveSearchParams(input).toString();
  const path = query ? `/api/movies/archive?${query}` : "/api/movies/archive";

  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });

  return movieArchiveResponseSchema.parse(response);
};

export const getMovieDetail = async (
  tmdbId: number,
  input: MovieDetailInput = {},
  options: QueryRequestOptions = {},
): Promise<MovieDetailResponse> => {
  const query = toMovieDetailSearchParams(input).toString();
  const path = query
    ? `/api/movies/${tmdbId}/detail?${query}`
    : `/api/movies/${tmdbId}/detail`;

  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });

  return movieDetailResponseSchema.parse(response);
};

export const getMovieReviews = async (
  tmdbId: number,
  input: MovieReviewsInput = {},
  options: QueryRequestOptions = {},
): Promise<MovieReviewsPageResponse> => {
  const query = toMovieReviewsSearchParams(input).toString();
  const path = query
    ? `/api/movies/${tmdbId}/reviews?${query}`
    : `/api/movies/${tmdbId}/reviews`;

  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });

  return movieReviewsPageResponseSchema.parse(response);
};
