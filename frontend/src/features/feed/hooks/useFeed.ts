import { useQuery } from "@tanstack/react-query";
import {
  getFollowingFeed,
  getMyFeedSummary,
  getNetworkStats,
  getTrendingMovies,
} from "@/features/feed/api";

export const feedKeys = {
  all: ["feed"] as const,
  following: ["feed", "following"] as const,
  trending: ["feed", "trending"] as const,
  meSummary: ["feed", "me-summary"] as const,
  networkStats: ["feed", "network-stats"] as const,
};

export const useFollowingFeed = (enabled = true) =>
  useQuery({
    queryKey: feedKeys.following,
    queryFn: ({ signal }) => getFollowingFeed(20, { signal }),
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
