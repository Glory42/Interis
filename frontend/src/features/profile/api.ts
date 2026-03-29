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

export type UserReview = z.infer<typeof userReviewSchema>;
export type UserFilm = z.infer<typeof userFilmSchema>;
export type UserTopMovie = z.infer<typeof userTopMovieSchema>;

export const getUserProfile = async (username: string): Promise<PublicProfile> => {
  const response = await apiRequest<unknown>(`/api/users/${username}`, {
    method: "GET",
  });

  return publicProfileSchema.parse(response);
};

export const getUserDiary = async (username: string): Promise<DiaryEntry[]> => {
  const response = await apiRequest<unknown>(`/api/users/${username}/diary`, {
    method: "GET",
  });

  return profileDiaryResponseSchema.parse(response);
};

export const getUserReviews = async (username: string): Promise<UserReview[]> => {
  const response = await apiRequest<unknown>(`/api/users/${username}/reviews`, {
    method: "GET",
  });

  return userReviewListSchema.parse(response);
};

export const getUserFilms = async (username: string): Promise<UserFilm[]> => {
  const response = await apiRequest<unknown>(`/api/users/${username}/films`, {
    method: "GET",
  });

  return userFilmListSchema.parse(response);
};

export const getUserTop4Movies = async (
  username: string,
): Promise<UserTopMovie[]> => {
  try {
    const response = await apiRequest<unknown>(`/api/public/${username}/top4`, {
      method: "GET",
    });

    return userTopMovieListSchema.parse(response);
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      return [];
    }

    throw error;
  }
};

export const getMyProfile = async (): Promise<MeProfile> => {
  const response = await apiRequest<unknown>("/api/users/me", {
    method: "GET",
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
