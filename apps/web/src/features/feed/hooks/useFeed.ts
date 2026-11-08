import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { FeedFilter } from "@/features/feed/types";
import {
  getGroupedFeed,
  getMyFeedSummary,
  getNetworkStats,
  getTrendingFilms,
  type FeedMediaTypeFilter,
} from "@/features/feed/api";

export const FEED_PAGE_SIZE = 15;

const toMediaTypeFilter = (filter: FeedFilter): FeedMediaTypeFilter | undefined => {
  if (filter === "movie") return "movie";
  if (filter === "serial") return "tv";
  return undefined;
};

export const feedKeys = {
  all: ["feed"] as const,
  // The Following Feed, every filter; feed-cache.ts patches and refreshes it by this prefix.
  groupedRoot: ["feed", "grouped"] as const,
  grouped: (filter: FeedFilter = "all") => ["feed", "grouped", filter] as const,
  trending: (limit = 3) => ["feed", "trending", limit] as const,
  meSummary: ["feed", "me-summary"] as const,
  networkStats: ["feed", "network-stats"] as const,
};

// Shared between useGroupedFeed and the route loader's prefetch so both use one key.
export const groupedFeedInfiniteQueryOptions = (filter: FeedFilter = "all") => ({
  queryKey: feedKeys.grouped(filter),
  queryFn: ({ signal, pageParam }: { signal: AbortSignal; pageParam: string | undefined }) =>
    getGroupedFeed(FEED_PAGE_SIZE, pageParam, toMediaTypeFilter(filter), { signal }),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getGroupedFeed>>) => lastPage.nextCursor ?? undefined,
});

export const useGroupedFeed = (filter: FeedFilter = "all", enabled = true) =>
  useInfiniteQuery({
    ...groupedFeedInfiniteQueryOptions(filter),
    enabled,
  });

// Shared with the home route loader so its prefetch can't drift onto a key nothing reads.
export const trendingFilmsQueryOptions = (limit = 3) => ({
  queryKey: feedKeys.trending(limit),
  queryFn: ({ signal }: { signal: AbortSignal }) => getTrendingFilms({ signal, limit }),
  staleTime: 300_000,
});

export const useTrendingNow = (limit = 3) => useQuery(trendingFilmsQueryOptions(limit));

export const useMyFeedSummary = (enabled = true) =>
  useQuery({
    queryKey: feedKeys.meSummary,
    queryFn: ({ signal }) => getMyFeedSummary({ signal }),
    enabled,
  });

export const useNetworkStats = () =>
  useQuery({
    queryKey: feedKeys.networkStats,
    queryFn: ({ signal }) => getNetworkStats({ signal }),
    staleTime: 300_000,
  });
