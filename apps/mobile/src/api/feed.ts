import { z } from "zod";
import { apiRequest, type QueryRequestOptions } from "./client";
import { feedPageSchema, trendingItemSchema, type FeedPage, type TrendingItem } from "@/types/feed";
import type { MediaType } from "@/types/common";

export const getFollowingFeed = async (
  input: { limit?: number; cursor?: string; mediaType?: MediaType },
  options: QueryRequestOptions = {},
): Promise<FeedPage> => {
  const params = new URLSearchParams({ limit: String(input.limit ?? 20) });
  if (input.cursor) params.set("cursor", input.cursor);
  if (input.mediaType) params.set("mediaType", input.mediaType);

  const response = await apiRequest<unknown>(`/api/social/feed/following?${params.toString()}`, {
    signal: options.signal,
  });
  return feedPageSchema.parse(response);
};

export const getTrendingMovies = async (options: QueryRequestOptions = {}): Promise<TrendingItem[]> => {
  const response = await apiRequest<unknown>("/api/movies/trending", { signal: options.signal });
  return z.array(trendingItemSchema).parse(response);
};

export const getTrendingSeries = async (options: QueryRequestOptions = {}): Promise<TrendingItem[]> => {
  const response = await apiRequest<unknown>("/api/serials/trending", { signal: options.signal });
  return z.array(trendingItemSchema).parse(response);
};
