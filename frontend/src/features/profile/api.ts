import { z } from "zod";
import { apiRequest } from "@/lib/api-client";
import { feedListSchema, type FeedItem } from "@/features/feed/types";
import {
  meProfileSchema,
  movieGenreSchema,
  publicTop4ResponseSchema,
  profileUpdateResponseSchema,
  publicProfileSchema,
  type MeProfile,
  type PublicTop4Response,
  type ProfileUpdateResponse,
  type PublicProfile,
  type UpdateProfileInput,
} from "@/types/api";

const userReviewSchema = z
  .object({
    id: z.string(),
    content: z.string(),
    containsSpoilers: z.boolean(),
    ratingOutOfFive: z.number().nullable().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    tmdbId: z.number().int(),
    title: z.string(),
    posterPath: z.string().nullable(),
    releaseYear: z.number().int().nullable(),
    mediaType: z.enum(["movie", "tv"]).default("movie"),
  })
  .passthrough();

const userReviewListSchema = z.array(userReviewSchema);

const userInteractionMovieSchema = z
  .object({
    tmdbId: z.number().int(),
    title: z.string(),
    posterPath: z.string().nullable(),
    releaseYear: z.number().int().nullable(),
    runtime: z.number().int().nullable(),
    genres: z.array(movieGenreSchema).nullish(),
    mediaType: z.enum(["movie", "tv"]).default("movie"),
    lastInteractionAt: z.string(),
  })
  .passthrough();

const userInteractionMovieListSchema = z.array(userInteractionMovieSchema);

const userSearchResultSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayUsername: z.string().nullable(),
  image: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

const userSearchResultListSchema = z.array(userSearchResultSchema);

type QueryRequestOptions = {
  signal?: AbortSignal;
};

const normalizeRecentLimit = (limit: number, fallback: number): number => {
  if (!Number.isFinite(limit)) {
    return fallback;
  }

  return Math.max(1, Math.min(Math.floor(limit), 300));
};

const encodePathSegment = (value: string): string => {
  return encodeURIComponent(value);
};

export type UserReview = z.infer<typeof userReviewSchema>;
export type UserInteractionMovie = z.infer<typeof userInteractionMovieSchema>;
export type UserTopPicks = PublicTop4Response;
export type UserTopPickCategory = UserTopPicks["categories"][number];
export type UserTopPickItem = UserTopPickCategory["items"][number];
export type UserRecentActivity = FeedItem;
export type UserSearchResult = z.infer<typeof userSearchResultSchema>;

export const getUserProfile = async (
  username: string,
  options: QueryRequestOptions = {},
): Promise<PublicProfile> => {
  const response = await apiRequest<unknown>(
    `/api/users/${encodePathSegment(username)}`,
    {
      method: "GET",
      signal: options.signal,
    },
  );

  return publicProfileSchema.parse(response);
};

export const getUserReviews = async (
  username: string,
  options: QueryRequestOptions = {},
): Promise<UserReview[]> => {
  const response = await apiRequest<unknown>(
    `/api/users/${encodePathSegment(username)}/reviews`,
    {
      method: "GET",
      signal: options.signal,
    },
  );

  return userReviewListSchema.parse(response);
};

export const getUserLikedFilms = async (
  username: string,
  options: QueryRequestOptions = {},
): Promise<UserInteractionMovie[]> => {
  const response = await apiRequest<unknown>(
    `/api/users/${encodePathSegment(username)}/likes`,
    {
      method: "GET",
      signal: options.signal,
    },
  );

  return userInteractionMovieListSchema.parse(response);
};

export const getUserWatchlist = async (
  username: string,
  options: QueryRequestOptions = {},
): Promise<UserInteractionMovie[]> => {
  const response = await apiRequest<unknown>(
    `/api/users/${encodePathSegment(username)}/watchlist`,
    {
      method: "GET",
      signal: options.signal,
    },
  );

  return userInteractionMovieListSchema.parse(response);
};

export const getUserTopPicks = async (
  username: string,
  options: QueryRequestOptions = {},
): Promise<UserTopPicks> => {
  const response = await apiRequest<unknown>(
    `/api/public/${encodePathSegment(username)}/top4`,
    {
      method: "GET",
      cache: "no-store",
      signal: options.signal,
    },
  );

  return publicTop4ResponseSchema.parse(response);
};

export const getUserRecentActivity = async (
  username: string,
  limit = 20,
  options: QueryRequestOptions = {},
): Promise<UserRecentActivity[]> => {
  const response = await apiRequest<unknown>(
    `/api/public/${encodePathSegment(username)}/recent?limit=${normalizeRecentLimit(limit, 20)}`,
    {
      method: "GET",
      cache: "no-store",
      signal: options.signal,
    },
  );

  return feedListSchema.parse(response);
};

export const searchUsers = async (
  query: string,
  input: { limit?: number } = {},
  options: QueryRequestOptions = {},
): Promise<UserSearchResult[]> => {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length === 0) {
    return [];
  }

  const searchParams = new URLSearchParams({
    query: normalizedQuery,
  });

  if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
    searchParams.set(
      "limit",
      String(Math.max(1, Math.min(20, Math.floor(input.limit)))),
    );
  }

  const response = await apiRequest<unknown>(`/api/users?${searchParams.toString()}`, {
    method: "GET",
    signal: options.signal,
  });

  return userSearchResultListSchema.parse(response);
};

export const getMyProfile = async (
  options: QueryRequestOptions = {},
): Promise<MeProfile> => {
  const response = await apiRequest<unknown>("/api/users/me", {
    method: "GET",
    signal: options.signal,
  });

  return meProfileSchema.parse(response);
};

export const updateMyProfile = async (
  payload: UpdateProfileInput,
): Promise<ProfileUpdateResponse> => {
  const response = await apiRequest<unknown, UpdateProfileInput>("/api/users/me", {
    method: "PUT",
    body: payload,
  });

  return profileUpdateResponseSchema.parse(response);
};
