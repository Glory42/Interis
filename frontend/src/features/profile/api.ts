import { z } from "zod";
import { apiRequest, isApiError } from "@/lib/api-client";
import {
  diaryEntrySchema,
  meProfileSchema,
  movieGenreSchema,
  profileUpdateResponseSchema,
  publicProfileSchema,
  type DiaryEntry,
  type MeProfile,
  type ProfileUpdateResponse,
  type PublicProfile,
  type UpdateProfileInput,
} from "@/types/api";

const profileDiaryResponseSchema = z.array(diaryEntrySchema);

const userReviewSchema = z
  .object({
    id: z.string(),
    content: z.string(),
    containsSpoilers: z.boolean(),
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

const userFilmSchema = z
  .object({
    tmdbId: z.number().int(),
    title: z.string(),
    posterPath: z.string().nullable(),
    releaseYear: z.number().int().nullable(),
    runtime: z.number().int().nullable(),
    genres: z.array(movieGenreSchema).nullish(),
    lastWatched: z.string(),
  })
  .passthrough();

const userFilmListSchema = z.array(userFilmSchema);

const userInteractionMovieSchema = z
  .object({
    tmdbId: z.number().int(),
    title: z.string(),
    posterPath: z.string().nullable(),
    releaseYear: z.number().int().nullable(),
    runtime: z.number().int().nullable(),
    genres: z.array(movieGenreSchema).nullish(),
    lastInteractionAt: z.string(),
  })
  .passthrough();

const userInteractionMovieListSchema = z.array(userInteractionMovieSchema);

const userTopMovieSchema = z
  .object({
    id: z.number().int(),
    tmdbId: z.number().int(),
    title: z.string(),
    posterPath: z.string().nullable(),
    releaseYear: z.number().int().nullable(),
    director: z.string().nullable().optional(),
  })
  .passthrough();

const userTopMovieListSchema = z.array(userTopMovieSchema);

const contributionMediaTypeSchema = z.enum(["film", "tv", "book", "music"]);

const contributionMediaCountsSchema = z.object({
  film: z.number().int().nonnegative(),
  tv: z.number().int().nonnegative(),
  book: z.number().int().nonnegative(),
  music: z.number().int().nonnegative(),
});

const userContributionDaySchema = z.object({
  date: z.string(),
  totalCount: z.number().int().nonnegative(),
  logCount: z.number().int().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
  mediaTypes: z.array(contributionMediaTypeSchema).optional(),
  mediaCounts: contributionMediaCountsSchema,
  mediaMask: z.number().int().min(0).max(15),
});

const userContributionCalendarSchema = z.object({
  window: z.object({
    startDate: z.string(),
    endDate: z.string(),
    days: z.number().int().positive(),
    weekStartsOn: z.literal("sunday"),
    timezone: z.literal("UTC"),
  }),
  totals: z.object({
    contributions: z.number().int().nonnegative(),
    activeDays: z.number().int().nonnegative(),
    logs: z.number().int().nonnegative(),
    reviews: z.number().int().nonnegative(),
    mediaCounts: contributionMediaCountsSchema,
  }),
  days: z.array(userContributionDaySchema),
});

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

const encodePathSegment = (value: string): string => {
  return encodeURIComponent(value);
};

export type UserReview = z.infer<typeof userReviewSchema>;
export type UserFilm = z.infer<typeof userFilmSchema>;
export type UserInteractionMovie = z.infer<typeof userInteractionMovieSchema>;
export type UserTopMovie = z.infer<typeof userTopMovieSchema>;
export type UserContributionMediaType = z.infer<typeof contributionMediaTypeSchema>;
export type UserContributionDay = z.infer<typeof userContributionDaySchema>;
export type UserContributionCalendar = z.infer<typeof userContributionCalendarSchema>;
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

export const getUserDiary = async (
  username: string,
  options: QueryRequestOptions = {},
): Promise<DiaryEntry[]> => {
  const response = await apiRequest<unknown>(
    `/api/users/${encodePathSegment(username)}/diary`,
    {
      method: "GET",
      signal: options.signal,
    },
  );

  return profileDiaryResponseSchema.parse(response);
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

export const getUserFilms = async (
  username: string,
  options: QueryRequestOptions = {},
): Promise<UserFilm[]> => {
  const response = await apiRequest<unknown>(
    `/api/users/${encodePathSegment(username)}/cinema`,
    {
      method: "GET",
      signal: options.signal,
    },
  );

  return userFilmListSchema.parse(response);
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

export const getUserTop4Movies = async (
  username: string,
  options: QueryRequestOptions = {},
): Promise<UserTopMovie[]> => {
  try {
    const response = await apiRequest<unknown>(
      `/api/public/${encodePathSegment(username)}/top4`,
      {
        method: "GET",
        cache: "no-store",
        signal: options.signal,
      },
    );

    return userTopMovieListSchema.parse(response);
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      return [];
    }

    throw error;
  }
};

export const getUserContributions = async (
  username: string,
  days?: number,
  options: QueryRequestOptions = {},
): Promise<UserContributionCalendar> => {
  const normalizedDays =
    typeof days === "number"
      ? Math.max(1, Math.min(730, Math.floor(days)))
      : null;
  const encodedUsername = encodePathSegment(username);
  const path =
    normalizedDays === null
      ? `/api/public/${encodedUsername}/contributions`
      : `/api/public/${encodedUsername}/contributions?days=${normalizedDays}`;

  const response = await apiRequest<unknown>(
    path,
    {
      method: "GET",
      cache: "no-store",
      signal: options.signal,
    },
  );

  return userContributionCalendarSchema.parse(response);
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
