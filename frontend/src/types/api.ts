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

export const favoriteGenreValues = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Documentary",
  "Drama",
  "Family",
  "Fantasy",
  "History",
  "Horror",
  "Music",
  "Mystery",
  "Romance",
  "Science Fiction",
  "Thriller",
  "War",
  "Western",
] as const;

export const favoriteGenreSchema = z.enum(favoriteGenreValues);

export const movieSchema = z
  .object({
    id: z.number().int(),
    tmdbId: z.number().int(),
    title: z.string(),
    originalTitle: z.string().nullable(),
    posterPath: z.string().nullable(),
    backdropPath: z.string().nullable(),
    releaseDate: z.string().nullish(),
    releaseYear: z.number().int().nullable(),
    director: z.string().nullish(),
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

const ratingOutOfFiveInputSchema = z
  .number()
  .min(0.5)
  .max(5)
  .multipleOf(0.5);

export const createDiaryEntryInputSchema = z.object({
  tmdbId: z.number().int().positive(),
  watchedDate: z.string(),
  ratingOutOfFive: ratingOutOfFiveInputSchema.optional(),
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
  filmCount: z.number().int().nonnegative().optional(),
  listCount: z.number().int().nonnegative().optional(),
  followerCount: z.number().int().nonnegative().optional(),
  followingCount: z.number().int().nonnegative().optional(),
});

export const publicProfileSchema = z
  .object({
    id: z.string(),
    name: z.string().nullish(),
    displayUsername: z.string().nullish(),
    image: z.string().nullish(),
    username: z.string(),
    bio: z.string().nullish(),
    location: z.string().nullish(),
    avatarUrl: z.string().nullish(),
    backdropUrl: z.string().nullish(),
    top4MovieIds: z.array(z.number().int()).nullish(),
    favoriteGenres: z.array(favoriteGenreSchema).nullish(),
    themeId: z.string().optional(),
    isAdmin: z.boolean(),
    createdAt: z.string().optional(),
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
    favoriteGenres: z.array(favoriteGenreSchema).nullish(),
    themeId: z.string().optional(),
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
  favoriteGenres: z.array(favoriteGenreSchema).max(8).optional(),
});

export const profileUpdateResponseSchema = z
  .object({
    userId: z.string(),
    bio: z.string().nullish(),
    location: z.string().nullish(),
    avatarUrl: z.string().nullish(),
    backdropUrl: z.string().nullish(),
    top4MovieIds: z.array(z.number().int()).nullish(),
    favoriteGenres: z.array(favoriteGenreSchema).nullish(),
    isAdmin: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();

export const loginInputSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerInputSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export type TmdbSearchMovie = z.infer<typeof tmdbSearchMovieSchema>;
export type FavoriteGenre = z.infer<typeof favoriteGenreSchema>;
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
export type LoginInput = z.infer<typeof loginInputSchema>;
export type RegisterInput = z.infer<typeof registerInputSchema>;
