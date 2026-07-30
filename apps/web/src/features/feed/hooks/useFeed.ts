import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import type { FeedFilter } from "@/features/feed/components/FeedActivityList";
import {
  getFollowingFeed,
  getMyFeedSummary,
  getNetworkStats,
  getTrendingMovies,
  type FeedMediaTypeFilter,
} from "@/features/feed/api";

export const FEED_PAGE_SIZE = 15;

const toMediaTypeFilter = (filter: FeedFilter): FeedMediaTypeFilter | undefined => {
  if (filter === "cinema") return "movie";
  if (filter === "serial") return "tv";
  return undefined;
};

export const feedKeys = {
  all: ["feed"] as const,
  // Root prefix for invalidating/patching every filter variant at once
  // (e.g. after liking a post, regardless of which tab is active).
  followingRoot: ["feed", "following"] as const,
  following: (filter: FeedFilter = "all") => ["feed", "following", filter] as const,
  trending: (limit = 3) => ["feed", "trending", limit] as const,
  meSummary: ["feed", "me-summary"] as const,
  networkStats: ["feed", "network-stats"] as const,
};

// Shared between useFollowingFeed and the route loader's prefetch call so
// both stay in sync on queryKey/queryFn/pagination behavior.
export const followingFeedInfiniteQueryOptions = (filter: FeedFilter = "all") => ({
  queryKey: feedKeys.following(filter),
  queryFn: ({ signal, pageParam }: { signal: AbortSignal; pageParam: string | undefined }) =>
    getFollowingFeed(FEED_PAGE_SIZE, pageParam, toMediaTypeFilter(filter), { signal }),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getFollowingFeed>>) =>
    lastPage.nextCursor ?? undefined,
});

export const useFollowingFeed = (filter: FeedFilter = "all", enabled = true) =>
  useInfiniteQuery({
    ...followingFeedInfiniteQueryOptions(filter),
    enabled,
  });

export const useTrendingNow = (limit = 3) =>
  useQuery({
    queryKey: feedKeys.trending(limit),
    queryFn: ({ signal }) => getTrendingMovies({ signal, limit }),
    staleTime: 300_000,
  });

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
