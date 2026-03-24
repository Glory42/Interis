import { z } from "zod";
import { apiRequest } from "@/lib/api-client";
import {
  movieSchema,
  movieLogSchema,
  tmdbSearchMovieSchema,
  type MovieLog,
  type Movie,
  type TmdbSearchMovie,
} from "@/types/api";

const movieSearchResponseSchema = z.array(tmdbSearchMovieSchema);
const movieLogsResponseSchema = z.array(movieLogSchema);

type QueryRequestOptions = {
  signal?: AbortSignal;
};

export const searchMovies = async (
  query: string,
  options: QueryRequestOptions = {},
): Promise<TmdbSearchMovie[]> => {
  const normalizedQuery = query.trim();
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
