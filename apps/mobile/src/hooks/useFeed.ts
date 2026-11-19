import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getFollowingFeed, getTrendingMovies, getTrendingSeries } from "@/api/feed";
import type { FeedFilter } from "@/types/feed";

export const feedKeys = {
  all: ["feed"] as const,
  following: (filter: FeedFilter) => ["feed", "following", filter] as const,
  trendingMovies: ["feed", "trending", "movies"] as const,
  trendingSeries: ["feed", "trending", "series"] as const,
};

const FEED_PAGE_SIZE = 20;

export const useFollowingFeed = (filter: FeedFilter, enabled: boolean) =>
  useInfiniteQuery({
    queryKey: feedKeys.following(filter),
    queryFn: ({ pageParam, signal }) =>
      getFollowingFeed(
        {
          limit: FEED_PAGE_SIZE,
          cursor: pageParam,
          mediaType: filter === "all" ? undefined : filter === "serial" ? "tv" : "movie",
        },
        { signal },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });

export const useTrendingMovies = () =>
  useQuery({
    queryKey: feedKeys.trendingMovies,
    queryFn: ({ signal }) => getTrendingMovies({ signal }),
    staleTime: 10 * 60_000,
  });

export const useTrendingSeries = () =>
  useQuery({
    queryKey: feedKeys.trendingSeries,
    queryFn: ({ signal }) => getTrendingSeries({ signal }),
    staleTime: 10 * 60_000,
  });
