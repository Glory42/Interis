import { z } from "zod";
import { apiRequest, encodeSegment, type QueryRequestOptions } from "./client";
import { feedListSchema, type FeedItem } from "@/types/feed";
import {
  currentlyWatchingSchema,
  diaryItemSchema,
  publicProfileSchema,
  topPicksSchema,
  userInteractionMediaSchema,
  userReviewSchema,
  type CurrentlyWatching,
  type DiaryItem,
  type PublicProfile,
  type TopPicks,
  type UserInteractionMedia,
  type UserReview,
} from "@/types/profile";
import { userSummarySchema, type UserSummary } from "@/types/common";

const page = (limit: number, offset: number) =>
  new URLSearchParams({ limit: String(limit), offset: String(offset) }).toString();

const userPath = (username: string, suffix = "") => `/api/users/${encodeSegment(username)}${suffix}`;

export const getUserProfile = async (
  username: string,
  options: QueryRequestOptions = {},
): Promise<PublicProfile> => {
  const response = await apiRequest<unknown>(userPath(username), { signal: options.signal });
  return publicProfileSchema.parse(response);
};

export const getUserTopPicks = async (
  username: string,
  options: QueryRequestOptions = {},
): Promise<TopPicks> => {
  const response = await apiRequest<unknown>(userPath(username, "/top4"), { signal: options.signal });
  return topPicksSchema.parse(response);
};

export const getUserRecentActivity = async (
  username: string,
  options: QueryRequestOptions = {},
): Promise<FeedItem[]> => {
  const response = await apiRequest<unknown>(userPath(username, "/recent?limit=20"), {
    signal: options.signal,
  });
  return feedListSchema.parse(response);
};

export const getUserCurrentlyWatching = async (
  username: string,
  options: QueryRequestOptions = {},
): Promise<CurrentlyWatching[]> => {
  const response = await apiRequest<unknown>(
    userPath(username, "/serials/currently-watching?limit=10"),
    { signal: options.signal },
  );
  return z.array(currentlyWatchingSchema).parse(response);
};

export const getUserDiary = async (
  username: string,
  limit: number,
  offset: number,
  options: QueryRequestOptions = {},
): Promise<DiaryItem[]> => {
  const response = await apiRequest<unknown>(userPath(username, `/diary?${page(limit, offset)}`), {
    signal: options.signal,
  });
  return z.array(diaryItemSchema).parse(response);
};

export const getUserReviews = async (
  username: string,
  limit: number,
  offset: number,
  options: QueryRequestOptions = {},
): Promise<UserReview[]> => {
  const response = await apiRequest<unknown>(userPath(username, `/reviews?${page(limit, offset)}`), {
    signal: options.signal,
  });
  return z.array(userReviewSchema).parse(response);
};

export const getUserLikes = async (
  username: string,
  limit: number,
  offset: number,
  options: QueryRequestOptions = {},
): Promise<UserInteractionMedia[]> => {
  const response = await apiRequest<unknown>(userPath(username, `/likes?${page(limit, offset)}`), {
    signal: options.signal,
  });
  return z.array(userInteractionMediaSchema).parse(response);
};

export const getUserWatchlist = async (
  username: string,
  limit: number,
  offset: number,
  options: QueryRequestOptions = {},
): Promise<UserInteractionMedia[]> => {
  const response = await apiRequest<unknown>(
    userPath(username, `/watchlist?${page(limit, offset)}`),
    { signal: options.signal },
  );
  return z.array(userInteractionMediaSchema).parse(response);
};

export const searchUsers = async (
  query: string,
  options: QueryRequestOptions = {},
): Promise<UserSummary[]> => {
  const normalized = query.trim();
  if (!normalized) return [];

  const params = new URLSearchParams({ query: normalized, limit: "8" });
  const response = await apiRequest<unknown>(`/api/users?${params.toString()}`, {
    signal: options.signal,
  });
  return z.array(userSummarySchema).parse(response);
};

export type UpdateProfileInput = {
  bio?: string;
  location?: string;
};

export const updateMyProfile = async (input: UpdateProfileInput): Promise<void> => {
  await apiRequest<unknown, UpdateProfileInput>("/api/users/me", { method: "PUT", body: input });
};
