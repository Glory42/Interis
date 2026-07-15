import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  getMySerialLogs,
  getRecentSeries,
  getSeriesArchive,
  getSeriesByTmdbId,
  getSeriesDetail,
  getSeriesInteraction,
  getSeriesLogs,
  getSeriesSeasonDetail,
  getTrendingSeries,
  searchSeries,
  type SerialArchivePeriod,
  type SerialArchiveSort,
  type SerialDetailReviewSort,
} from "@/features/serials/api";
import { serialKeys } from "./query-keys";

export const useSerialSearch = (query: string) =>
  useQuery({
    queryKey: serialKeys.search(query),
    queryFn: ({ signal }) => searchSeries(query, { signal }),
    enabled: query.trim().length >= 2,
  });

export const useSeriesDetail = (tmdbId: number, enabled = true) =>
  useQuery({
    queryKey: serialKeys.detail(tmdbId),
    queryFn: ({ signal }) => getSeriesByTmdbId(tmdbId, { signal }),
    enabled,
  });

export const useSeriesDetailView = (
  tmdbId: number,
  reviewsSort: SerialDetailReviewSort,
  enabled = true,
) =>
  useQuery({
    queryKey: serialKeys.detailView(tmdbId, reviewsSort),
    queryFn: ({ signal }) => getSeriesDetail(tmdbId, { reviewsSort }, { signal }),
    enabled,
  });

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
