import { apiRequest } from "@/lib/api-client";
import {
  feedListSchema,
  meFeedSummarySchema,
  networkStatsSchema,
  trendingMovieListSchema,
  type FeedItem,
  type MeFeedSummary,
  type NetworkStats,
  type TrendingMovie,
} from "@/features/feed/types";

const normalizeLimit = (limit: number, fallback: number): number => {
  if (!Number.isFinite(limit)) {
    return fallback;
  }

  return Math.max(1, Math.min(Math.floor(limit), 40));
};

export const getFollowingFeed = async (limit = 20): Promise<FeedItem[]> => {
  const response = await apiRequest<unknown>(
    `/api/social/feed/following?limit=${normalizeLimit(limit, 20)}`,
    {
      method: "GET",
    },
  );

  return feedListSchema.parse(response);
};

export const getTrendingMovies = async (): Promise<TrendingMovie[]> => {
  const response = await apiRequest<unknown>("/api/movies/trending", {
    method: "GET",
  });

  return trendingMovieListSchema.parse(response).slice(0, 4);
};

export const getMyFeedSummary = async (): Promise<MeFeedSummary> => {
  const response = await apiRequest<unknown>("/api/users/me/summary", {
    method: "GET",
  });

  return meFeedSummarySchema.parse(response);
};

export const getNetworkStats = async (): Promise<NetworkStats> => {
  const response = await apiRequest<unknown>("/api/users/stats/network", {
    method: "GET",
  });

  return networkStatsSchema.parse(response);
};
