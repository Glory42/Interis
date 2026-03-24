import { useQuery } from "@tanstack/react-query";
import {
  getMovieByTmdbId,
  getMovieLogs,
  getRecentMovies,
  searchMovies,
} from "@/features/films/api";

export const movieKeys = {
  all: ["movies"] as const,
  search: (query: string) => ["movies", "search", query] as const,
  detail: (tmdbId: number) => ["movies", "detail", tmdbId] as const,
  recent: ["movies", "recent"] as const,
  logs: (tmdbId: number) => ["movies", "logs", tmdbId] as const,
};

export const useMovieSearch = (query: string) =>
  useQuery({
    queryKey: movieKeys.search(query),
    queryFn: ({ signal }) => searchMovies(query, { signal }),
    enabled: query.trim().length >= 2,
  });

export const useMovieDetail = (tmdbId: number, enabled = true) =>
  useQuery({
    queryKey: movieKeys.detail(tmdbId),
    queryFn: ({ signal }) => getMovieByTmdbId(tmdbId, { signal }),
    enabled,
  });

export const useRecentMovies = () =>
  useQuery({
    queryKey: movieKeys.recent,
    queryFn: ({ signal }) => getRecentMovies({ signal }),
  });

export const useMovieLogs = (tmdbId: number, enabled = true) =>
  useQuery({
    queryKey: movieKeys.logs(tmdbId),
    queryFn: ({ signal }) => getMovieLogs(tmdbId, { signal }),
    enabled,
  });
