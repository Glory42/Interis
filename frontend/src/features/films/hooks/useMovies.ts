import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getMovieArchive,
  getMovieByTmdbId,
  getMovieDetail,
  getMovieLogs,
  getRecentMovies,
  searchMovies,
  type MovieArchivePeriod,
  type MovieArchiveSort,
  type MovieDetailReviewSort,
} from "@/features/films/api";

export const movieKeys = {
  all: ["movies"] as const,
  search: (query: string) => ["movies", "search", query] as const,
  detail: (tmdbId: number) => ["movies", "detail", tmdbId] as const,
  detailView: (tmdbId: number, reviewsSort: MovieDetailReviewSort) =>
    ["movies", "detail-view", tmdbId, reviewsSort] as const,
  recent: ["movies", "recent"] as const,
  logs: (tmdbId: number) => ["movies", "logs", tmdbId] as const,
  archive: (
    genre: string,
    language: string,
    sort: MovieArchiveSort,
    period: MovieArchivePeriod,
    limit: number,
  ) => ["movies", "archive", genre, language, sort, period, limit] as const,
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

export const useMovieDetailView = (
  tmdbId: number,
  reviewsSort: MovieDetailReviewSort,
  enabled = true,
) =>
  useQuery({
    queryKey: movieKeys.detailView(tmdbId, reviewsSort),
    queryFn: ({ signal }) => getMovieDetail(tmdbId, { reviewsSort }, { signal }),
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

export const useMovieArchive = (
  genre: string,
  language: string,
  sort: MovieArchiveSort,
  period: MovieArchivePeriod,
  limit: number,
) =>
  useInfiniteQuery({
    queryKey: movieKeys.archive(genre, language, sort, period, limit),
    initialPageParam: 1,
    queryFn: ({ signal, pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 1;

      return getMovieArchive(
        {
          genre,
          language,
          sort,
          period,
          page,
          limit,
        },
        { signal },
      );
    },
    getNextPageParam: (lastPage) => lastPage.nextPage ?? undefined,
  });
