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
  // Prefix-only variant (no reviewsSort) - matches every sort variant for a
  // given movie, for invalidations that don't care which sort is cached.
  detailViewRoot: (tmdbId: number) => ["movies", "detail-view", tmdbId] as const,
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

// Movie metadata (title/poster/overview/genres) is TMDB-backed and rarely
// changes within a session, so this can outlive the 30s global default.
const MOVIE_DETAIL_STALE_TIME_MS = 300_000;

export const useMovieDetail = (tmdbId: number, enabled = true) =>
  useQuery({
    queryKey: movieKeys.detail(tmdbId),
    queryFn: ({ signal }) => getMovieByTmdbId(tmdbId, { signal }),
    enabled,
    staleTime: MOVIE_DETAIL_STALE_TIME_MS,
  });

export const useMovieDetailView = (
  tmdbId: number,
  reviewsSort: MovieDetailReviewSort,
  enabled = true,
) =>
  useQuery({
    queryKey: movieKeys.detailView(tmdbId, reviewsSort),
    // Bundles reviews/ratingBreakdown alongside static movie fields, so it
    // stays on the global 30s staleTime rather than the longer one below —
    // those change too often to treat as long-lived.
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
