import { useCallback, useState } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getMySerialLogs,
  getRecentSeries,
  getSeriesArchive,
  getSeriesByTmdbId,
  getSeriesDetail,
  getSeriesInteraction,
  getSeriesLogs,
  getSeriesReviews,
  getSeriesSeasonDetail,
  getTrendingSeries,
  searchSeries,
  type SerialArchivePeriod,
  type SerialArchiveSort,
  type SerialDetailReviewItem,
  type SerialDetailReviewSort,
} from "@/features/serials/api";
import { serialKeys } from "./query-keys";

export const useSerialSearch = (query: string) =>
  useQuery({
    queryKey: serialKeys.search(query),
    queryFn: ({ signal }) => searchSeries(query, { signal }),
    enabled: query.trim().length >= 2,
  });

// Series metadata (title/poster/overview/genres/season-episode counts) is
// TMDB-backed and rarely changes within a session, so this can outlive the
// 30s global default.
const SERIES_DETAIL_STALE_TIME_MS = 300_000;

export const useSeriesDetail = (tmdbId: number, enabled = true) =>
  useQuery({
    queryKey: serialKeys.detail(tmdbId),
    queryFn: ({ signal }) => getSeriesByTmdbId(tmdbId, { signal }),
    enabled,
    staleTime: SERIES_DETAIL_STALE_TIME_MS,
  });

export const useSeriesDetailView = (
  tmdbId: number,
  reviewsSort: SerialDetailReviewSort,
  enabled = true,
) =>
  useQuery({
    queryKey: serialKeys.detailView(tmdbId, reviewsSort),
    // Bundles reviews/ratingBreakdown alongside static series fields, so it
    // stays on the global 30s staleTime — those change too often to treat
    // as long-lived.
    queryFn: ({ signal }) => getSeriesDetail(tmdbId, { reviewsSort }, { signal }),
    enabled,
  });

// Series-level only, mirrors useMovieReviewsLoadMore.
// Remount (e.g. `key={reviewsSort}`) when reviewsSort changes.
export const useSeriesReviewsLoadMore = (
  tmdbId: number,
  sort: SerialDetailReviewSort,
  limit: number,
  initialHasMore: boolean,
) => {
  const [extraItems, setExtraItems] = useState<SerialDetailReviewItem[]>([]);
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
      const response = await getSeriesReviews(tmdbId, { sort, page: nextPage, limit });
      setExtraItems((previous) => [...previous, ...response.items]);
      setPage(nextPage);
      setHasMore(response.hasMore);
    } finally {
      setIsLoading(false);
    }
  }, [tmdbId, sort, limit, page, hasMore, isLoading]);

  return { extraItems, loadMore, isLoading, hasMore };
};

export const useSeriesInteraction = (tmdbId: number, enabled = true) =>
  useQuery({
    queryKey: serialKeys.interaction(tmdbId),
    queryFn: () => getSeriesInteraction(tmdbId),
    enabled,
  });

export const useSeriesSeasonDetail = (
  tmdbId: number,
  seasonNumber: number,
  enabled = true,
) =>
  useQuery({
    queryKey: serialKeys.seasonDetail(tmdbId, seasonNumber),
    queryFn: ({ signal }) => getSeriesSeasonDetail(tmdbId, seasonNumber, { signal }),
    enabled,
  });

export const useTrendingSeries = () =>
  useQuery({
    queryKey: serialKeys.trending,
    queryFn: ({ signal }) => getTrendingSeries({ signal }),
  });

export const useRecentSeries = () =>
  useQuery({
    queryKey: serialKeys.recent,
    queryFn: ({ signal }) => getRecentSeries({ signal }),
  });

export const useSeriesLogs = (tmdbId: number, enabled = true) =>
  useQuery({
    queryKey: serialKeys.logs(tmdbId),
    queryFn: ({ signal }) => getSeriesLogs(tmdbId, { signal }),
    enabled,
  });

export const useMySerialLogs = () =>
  useQuery({
    queryKey: serialKeys.myLogs,
    queryFn: getMySerialLogs,
  });

export const useSeriesArchive = (
  genre: string,
  language: string,
  sort: SerialArchiveSort,
  period: SerialArchivePeriod,
  limit: number,
) =>
  useInfiniteQuery({
    queryKey: serialKeys.archive(genre, language, sort, period, limit),
    initialPageParam: 1,
    queryFn: ({ signal, pageParam }) => {
      const page = typeof pageParam === "number" ? pageParam : 1;

      return getSeriesArchive(
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
