import { apiRequest, type QueryRequestOptions } from "@/lib/api-client";
import {
  groupedFeedPageSchema,
  meFeedSummarySchema,
  networkStatsSchema,
  trendingMovieListSchema,
  type GroupedFeedPage,
  type MeFeedSummary,
  type NetworkStats,
  type TrendingMovie,
} from "@/features/feed/types";
import type { MediaType } from "@/types/api";

const normalizeLimit = (limit: number, fallback: number): number => {
  if (!Number.isFinite(limit)) {
    return fallback;
  }

  return Math.max(1, Math.min(Math.floor(limit), 300));
};

export type FeedMediaTypeFilter = MediaType;

// Same-day actions on a title arrive merged (PR-10); a filtered page can come back short.
export const getGroupedFeed = async (
  limit = 20,
  cursor?: string,
  mediaType?: FeedMediaTypeFilter,
  options: QueryRequestOptions = {},
): Promise<GroupedFeedPage> => {
  const params = new URLSearchParams({ limit: String(normalizeLimit(limit, 20)) });
  if (cursor) {
    params.set("cursor", cursor);
  }
  if (mediaType) {
    params.set("mediaType", mediaType);
  }

  const response = await apiRequest<unknown>(`/api/social/feed/grouped?${params.toString()}`, {
    method: "GET",
    signal: options.signal,
  });

  return groupedFeedPageSchema.parse(response);
};

export const getTrendingMovies = async (
  options: QueryRequestOptions & { limit?: number } = {},
): Promise<TrendingMovie[]> => {
  const response = await apiRequest<unknown>("/api/movies/trending", {
    method: "GET",
    signal: options.signal,
  });

  return trendingMovieListSchema.parse(response).slice(0, options.limit ?? 3);
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
