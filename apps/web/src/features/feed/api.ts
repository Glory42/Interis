import { apiRequest } from "@/lib/api-client";
import {
  feedPageSchema,
  meFeedSummarySchema,
  networkStatsSchema,
  trendingMovieListSchema,
  type FeedPage,
  type MeFeedSummary,
  type NetworkStats,
  type TrendingMovie,
} from "@/features/feed/types";

const normalizeLimit = (limit: number, fallback: number): number => {
  if (!Number.isFinite(limit)) {
    return fallback;
  }

  return Math.max(1, Math.min(Math.floor(limit), 300));
};

type QueryRequestOptions = {
  signal?: AbortSignal;
};

export type FeedMediaTypeFilter = "movie" | "tv";

export const getFollowingFeed = async (
  limit = 20,
  cursor?: string,
  mediaType?: FeedMediaTypeFilter,
  options: QueryRequestOptions = {},
): Promise<FeedPage> => {
  const params = new URLSearchParams({ limit: String(normalizeLimit(limit, 20)) });
  if (cursor) {
    params.set("cursor", cursor);
  }
  if (mediaType) {
    params.set("mediaType", mediaType);
  }

  const response = await apiRequest<unknown>(
    `/api/social/feed/following?${params.toString()}`,
    {
      method: "GET",
      signal: options.signal,
    },
  );

  return feedPageSchema.parse(response);
};

export const getTrendingMovies = async (
  options: QueryRequestOptions = {},
): Promise<TrendingMovie[]> => {
  const response = await apiRequest<unknown>("/api/movies/trending", {
    method: "GET",
    signal: options.signal,
  });

  return trendingMovieListSchema.parse(response).slice(0, 3);
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
