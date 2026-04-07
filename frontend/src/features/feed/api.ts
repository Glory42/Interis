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

type QueryRequestOptions = {
  signal?: AbortSignal;
};

export const getFollowingFeed = async (
  limit = 20,
  options: QueryRequestOptions = {},
): Promise<FeedItem[]> => {
  const response = await apiRequest<unknown>(
    `/api/social/feed/following?limit=${normalizeLimit(limit, 20)}`,
    {
      method: "GET",
      signal: options.signal,
    },
  );

  return feedListSchema.parse(response);
};

export const getTrendingMovies = async (
  options: QueryRequestOptions = {},
): Promise<TrendingMovie[]> => {
  const response = await apiRequest<unknown>("/api/movies/trending", {
    method: "GET",
    signal: options.signal,
  });

  return trendingMovieListSchema.parse(response).slice(0, 4);
};

export const getMyFeedSummary = async (
  options: QueryRequestOptions = {},
): Promise<MeFeedSummary> => {
  const response = await apiRequest<unknown>("/api/users/me/summary", {
    method: "GET",
    signal: options.signal,
  });

  return meFeedSummarySchema.parse(response);
};

export const getNetworkStats = async (
  options: QueryRequestOptions = {},
): Promise<NetworkStats> => {
  const response = await apiRequest<unknown>("/api/users/stats/network", {
    method: "GET",
    signal: options.signal,
  });

  return networkStatsSchema.parse(response);
};
