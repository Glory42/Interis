import { z } from "zod";

export const tmdbSearchMovieSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  poster_path: z.string().nullable(),
  release_date: z.string(),
  overview: z.string(),
});

export const movieGenreSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

export const movieSchema = z
  .object({
    id: z.number().int(),
    tmdbId: z.number().int(),
    title: z.string(),
    originalTitle: z.string().nullable(),
    posterPath: z.string().nullable(),
    backdropPath: z.string().nullable(),
    releaseYear: z.number().int().nullable(),
    runtime: z.number().int().nullable(),
    overview: z.string().nullable(),
    tagline: z.string().nullable(),
    genres: z.array(movieGenreSchema).nullish(),
    cachedAt: z.string(),
  })
  .passthrough();

export const createdDiaryEntrySchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    movieId: z.number().int(),
    watchedDate: z.string(),
    rating: z.number().int().nullable(),
    rewatch: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const diaryEntrySchema = z
  .object({
    id: z.string(),
    watchedDate: z.string(),
    rating: z.number().int().nullable(),
    rewatch: z.boolean(),
    movieId: z.number().int(),
    createdAt: z.string(),
    updatedAt: z.string(),
    movieTmdbId: z.number().int(),
    movieTitle: z.string(),
    moviePosterPath: z.string().nullable(),
    movieReleaseYear: z.number().int().nullable(),
    reviewId: z.string().nullable(),
    reviewContent: z.string().nullable(),
    reviewContainsSpoilers: z.boolean().nullable(),
    reviewCreatedAt: z.string().nullable(),
  })
  .passthrough();

export const movieLogSchema = z
  .object({
    diaryEntryId: z.string(),
    watchedDate: z.string(),
    rating: z.number().int().nullable(),
    rewatch: z.boolean(),
    createdAt: z.string(),
    username: z.string(),
    userDisplayName: z.string(),
    avatarUrl: z.string().nullable(),
    reviewContent: z.string().nullable(),
    reviewContainsSpoilers: z.boolean().nullable(),
    reviewUpdatedAt: z.string().nullable(),
  })
  .passthrough();

export const createDiaryEntryInputSchema = z.object({
  tmdbId: z.number().int().positive(),
  watchedDate: z.string(),
  rating: z.number().int().min(0).max(10).optional(),
  rewatch: z.boolean().optional(),
  review: z.string().max(5000).optional(),
  containsSpoilers: z.boolean().optional(),
});

export const diaryReviewSchema = z
  .object({
    id: z.string(),
    content: z.string(),
    containsSpoilers: z.boolean(),
  })
  .nullable();

export const createDiaryEntryResponseSchema = z
  .object({
    entry: createdDiaryEntrySchema,
    movie: movieSchema,
    review: diaryReviewSchema,
  })
  .passthrough();

export const userStatsSchema = z.object({
  entryCount: z.number().int().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
});

export const publicProfileSchema = z
  .object({
    id: z.string(),
    name: z.string().nullish(),
    image: z.string().nullish(),
    username: z.string(),
    bio: z.string().nullish(),
    location: z.string().nullish(),
    avatarUrl: z.string().nullish(),
    backdropUrl: z.string().nullish(),
    top4MovieIds: z.array(z.number().int()).nullish(),
    isAdmin: z.boolean(),
    stats: userStatsSchema.optional(),
  })
  .passthrough();

export const meProfileSchema = z
  .object({
    id: z.string(),
    name: z.string().nullish(),
    email: z.string().email(),
    image: z.string().nullish(),
    username: z.string(),
    bio: z.string().nullish(),
    location: z.string().nullish(),
    avatarUrl: z.string().nullish(),
    backdropUrl: z.string().nullish(),
    top4MovieIds: z.array(z.number().int()).nullish(),
    isAdmin: z.boolean(),
    createdAt: z.string().optional(),
  })
  .passthrough();

export const updateProfileInputSchema = z.object({
  bio: z.string().max(300).optional(),
  location: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  backdropUrl: z.string().url().optional().or(z.literal("")),
  top4MovieIds: z.array(z.number().int().positive()).optional(),
});

export const profileUpdateResponseSchema = z
  .object({
    userId: z.string(),
    username: z.string(),
    bio: z.string().nullish(),
    location: z.string().nullish(),
    avatarUrl: z.string().nullish(),
    backdropUrl: z.string().nullish(),
    top4MovieIds: z.array(z.number().int()).nullish(),
    isAdmin: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const updateUsernameInputSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(50)
    .regex(/^[a-zA-Z0-9_]+$/),
});

export const updateUsernameResponseSchema = z
  .object({
    username: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerInputSchema = z.object({
  name: z.string().min(2).max(60),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type TmdbSearchMovie = z.infer<typeof tmdbSearchMovieSchema>;
export type Movie = z.infer<typeof movieSchema>;
export type DiaryEntry = z.infer<typeof diaryEntrySchema>;
export type MovieLog = z.infer<typeof movieLogSchema>;
export type CreateDiaryEntryInput = z.infer<typeof createDiaryEntryInputSchema>;
export type CreateDiaryEntryResponse = z.infer<
  typeof createDiaryEntryResponseSchema
>;
export type PublicProfile = z.infer<typeof publicProfileSchema>;
export type MeProfile = z.infer<typeof meProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
export type ProfileUpdateResponse = z.infer<typeof profileUpdateResponseSchema>;
export type UpdateUsernameInput = z.infer<typeof updateUsernameInputSchema>;
export type UpdateUsernameResponse = z.infer<typeof updateUsernameResponseSchema>;
export type LoginInput = z.infer<typeof loginInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
