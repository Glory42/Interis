import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFollowingFeed,
  getMyFeedSummary,
  getNetworkStats,
  getTrendingMovies,
  likeActivity,
  unlikeActivity,
} from "@/features/feed/api";

export const FEED_PAGE_SIZE = 15;

export const feedKeys = {
  all: ["feed"] as const,
  following: ["feed", "following"] as const,
  trending: ["feed", "trending"] as const,
  meSummary: ["feed", "me-summary"] as const,
  networkStats: ["feed", "network-stats"] as const,
};

// Shared between useFollowingFeed and the route loader's prefetch call so
// both stay in sync on queryKey/queryFn/pagination behavior.
export const followingFeedInfiniteQueryOptions = () => ({
  queryKey: feedKeys.following,
  queryFn: ({ signal, pageParam }: { signal: AbortSignal; pageParam: string | undefined }) =>
    getFollowingFeed(FEED_PAGE_SIZE, pageParam, { signal }),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: (lastPage: Awaited<ReturnType<typeof getFollowingFeed>>) =>
    lastPage.nextCursor ?? undefined,
});

export const useFollowingFeed = (enabled = true) =>
  useInfiniteQuery({
    ...followingFeedInfiniteQueryOptions(),
    enabled,
  });

export const useTrendingNow = () =>
  useQuery({
    queryKey: feedKeys.trending,
    queryFn: ({ signal }) => getTrendingMovies({ signal }),
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

export const useLikeActivity = (activityId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => likeActivity(activityId),
    onSuccess: () => {
      // Prefix-matches every limit variant of the following feed only -
      // trending/meSummary/networkStats never contain like data.
      void queryClient.invalidateQueries({ queryKey: feedKeys.following });
    },
  });
};

export const useUnlikeActivity = (activityId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => unlikeActivity(activityId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: feedKeys.following });
    },
  });
};
