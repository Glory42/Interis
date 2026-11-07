import { useCallback, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getFilmArchive,
  getFilmByTmdbId,
  getFilmDetail,
  getFilmLogs,
  getFilmReviews,
  getRecentFilms,
  searchFilms,
  type FilmArchivePeriod,
  type FilmArchiveSort,
  type FilmDetailReviewItem,
  type FilmDetailReviewSort,
} from "@/features/films/api";

export const filmKeys = {
  all: ["movies"] as const,
  search: (query: string) => ["movies", "search", query] as const,
  detail: (tmdbId: number) => ["movies", "detail", tmdbId] as const,
  detailView: (tmdbId: number, reviewsSort: FilmDetailReviewSort) =>
    ["movies", "detail-view", tmdbId, reviewsSort] as const,
  // Prefix-only variant (no reviewsSort) - matches every sort variant for a
  // given movie, for invalidations that don't care which sort is cached.
  detailViewRoot: (tmdbId: number) => ["movies", "detail-view", tmdbId] as const,
  recent: ["movies", "recent"] as const,
  logs: (tmdbId: number) => ["movies", "logs", tmdbId] as const,
  archive: (
    genre: string,
    language: string,
    sort: FilmArchiveSort,
    period: FilmArchivePeriod,
    limit: number,
  ) => ["movies", "archive", genre, language, sort, period, limit] as const,
};

export const useFilmSearch = (query: string) =>
  useQuery({
    queryKey: filmKeys.search(query),
    queryFn: ({ signal }) => searchFilms(query, { signal }),
    enabled: query.trim().length >= 2,
  });

// Movie metadata (title/poster/overview/genres) is TMDB-backed and rarely
// changes within a session, so this can outlive the 30s global default.
const FILM_DETAIL_STALE_TIME_MS = 300_000;

export const useFilmDetail = (tmdbId: number, enabled = true) =>
  useQuery({
    queryKey: filmKeys.detail(tmdbId),
    queryFn: ({ signal }) => getFilmByTmdbId(tmdbId, { signal }),
    enabled,
    staleTime: FILM_DETAIL_STALE_TIME_MS,
  });

export const useFilmDetailView = (
  tmdbId: number,
  reviewsSort: FilmDetailReviewSort,
  enabled = true,
) =>
  useQuery({
    queryKey: filmKeys.detailView(tmdbId, reviewsSort),
    // Bundles reviews/ratingBreakdown alongside static movie fields, so it
    // stays on the global 30s staleTime rather than the longer one below —
    // those change too often to treat as long-lived.
    queryFn: ({ signal }) => getFilmDetail(tmdbId, { reviewsSort }, { signal }),
    enabled,
  });

// Appends review pages beyond the one already in the detail response.
// Remount (e.g. `key={reviewsSort}`) when reviewsSort changes.
export const useFilmReviewsLoadMore = (
  tmdbId: number,
  sort: FilmDetailReviewSort,
  limit: number,
  initialHasMore: boolean,
) => {
  const [extraItems, setExtraItems] = useState<FilmDetailReviewItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [isLoading, setIsLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) {
      return;
    }

    setIsLoading(true);
    try {
      const nextPage = page + 1;
      const response = await getFilmReviews(tmdbId, { sort, page: nextPage, limit });
      setExtraItems((previous) => [...previous, ...response.items]);
      setPage(nextPage);
      setHasMore(response.hasMore);
    } finally {
      setIsLoading(false);
    }
  }, [tmdbId, sort, limit, page, hasMore, isLoading]);

  return { extraItems, loadMore, isLoading, hasMore };
};

export const useRecentFilms = () =>
  useQuery({
    queryKey: filmKeys.recent,
    queryFn: ({ signal }) => getRecentFilms({ signal }),
  });

export const useFilmLogs = (tmdbId: number, enabled = true) =>
  useQuery({
    queryKey: filmKeys.logs(tmdbId),
    queryFn: ({ signal }) => getFilmLogs(tmdbId, { signal }),
    enabled,
  });

export const useFilmArchive = (
  genre: string,
  language: string,
  sort: FilmArchiveSort,
  period: FilmArchivePeriod,
  limit: number,
) =>
  useInfiniteQuery({
    queryKey: filmKeys.archive(genre, language, sort, period, limit),
    initialPageParam: 1,
    queryFn: ({ signal, pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 1;

      return getFilmArchive(
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
