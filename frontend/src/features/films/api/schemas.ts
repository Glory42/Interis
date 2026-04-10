import { z } from "zod";
import { personLinkSchema } from "@/features/people/shared";
import { movieLogSchema, movieSchema, tmdbSearchMovieSchema } from "@/types/api";

export { movieLogSchema, movieSchema, tmdbSearchMovieSchema };

export const movieSearchResponseSchema = z.array(tmdbSearchMovieSchema);
export const movieLogsResponseSchema = z.array(movieLogSchema);

const archiveGenreSchema = z.object({
  id: z.number().int(),
  name: z.string(),
});

const archiveMovieSchema = z.object({
  tmdbId: z.number().int(),
  title: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  releaseDate: z.string().nullable(),
  releaseYear: z.number().int().nullable(),
  director: z.string().nullable(),
  languageCode: z.string().nullable(),
  genres: z.array(archiveGenreSchema),
  primaryGenre: z.string().nullable(),
  logCount: z.number().int().nonnegative(),
  avgRatingOutOfTen: z.number().nullable(),
  tmdbRatingOutOfTen: z.number().nullable(),
  ratedLogCount: z.number().int().nonnegative(),
  viewerHasLogged: z.boolean(),
  viewerWatchlisted: z.boolean(),
});

const archiveFeaturedMovieSchema = z.object({
  tmdbId: z.number().int(),
  title: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  releaseDate: z.string().nullable(),
  releaseYear: z.number().int().nullable(),
  director: z.string().nullable(),
});

const archiveGenreCountSchema = z.object({
  id: z.number().int().nullable().optional(),
  name: z.string(),
  count: z.number().int().nonnegative().nullable(),
});

export const archiveSortSchema = z.enum([
  "trending",
  "release_desc",
  "release_asc",
  "logs_desc",
  "rating_user_desc",
  "rating_tmdb_desc",
  "title_asc",
]);

export const archivePeriodSchema = z.enum([
  "all_time",
  "this_year",
  "last_10_years",
  "this_week",
  "today",
]);

export const movieDetailReviewSortSchema = z.enum(["popular", "recent"]);

const movieDetailMovieSchema = z.object({
  id: z.number().int(),
  tmdbId: z.number().int(),
  title: z.string(),
  originalTitle: z.string().nullable(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  releaseDate: z.string().nullable(),
  releaseYear: z.number().int().nullable(),
  director: z.string().nullable(),
  directors: z.array(personLinkSchema).default([]),
  cast: z.array(personLinkSchema).default([]),
  runtime: z.number().int().nullable(),
  overview: z.string().nullable(),
  tagline: z.string().nullable(),
  genres: z.array(archiveGenreSchema),
  languageCode: z.string().nullable(),
  productionCountries: z.array(z.string()),
  budget: z.number().nullable(),
  revenue: z.number().nullable(),
  globalRatingOutOfTen: z.number().nullable(),
  globalRatingOutOfFive: z.number().nullable(),
  globalRatingVoteCount: z.number().int().nullable(),
});

const movieDetailUserRatingSchema = z
  .object({
    diaryEntryId: z.string().nullable(),
    reviewId: z.string().nullable(),
    watchedDate: z.string().nullable(),
    rewatch: z.boolean(),
    ratingOutOfTen: z.number().nullable(),
    ratingOutOfFive: z.number().nullable(),
    reviewContent: z.string().nullable(),
    reviewContainsSpoilers: z.boolean().nullable(),
  })
  .nullable();

const movieDetailReviewSchema = z.object({
  id: z.string(),
  content: z.string(),
  containsSpoilers: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  watchedDate: z.string().nullable(),
  ratingOutOfTen: z.number().nullable(),
  ratingOutOfFive: z.number().nullable(),
  likeCount: z.number().int().nonnegative(),
  viewerHasLiked: z.boolean(),
  author: z.object({
    id: z.string(),
    username: z.string(),
    displayUsername: z.string().nullable(),
    image: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }),
});

const movieDetailRatingBreakdownBucketSchema = z.object({
  ratingValueOutOfFive: z.number().int().min(1).max(5),
  count: z.number().int().nonnegative(),
  percentage: z.number().int().min(0).max(100),
});

export const movieDetailResponseSchema = z.object({
  movie: movieDetailMovieSchema,
  logsCount: z.number().int().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
  userRating: movieDetailUserRatingSchema,
  reviewsSort: movieDetailReviewSortSchema,
  reviews: z.array(movieDetailReviewSchema),
  ratingBreakdown: z.object({
    totalRatedReviews: z.number().int().nonnegative(),
    averageRatingOutOfFive: z.number().nullable(),
    buckets: z.array(movieDetailRatingBreakdownBucketSchema),
  }),
});

export const movieArchiveResponseSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  filteredCount: z.number().int().nonnegative(),
  selectedGenre: z.string().nullable(),
  selectedLanguage: z.string().nullable(),
  selectedSort: archiveSortSchema,
  selectedPeriod: archivePeriodSchema,
  featuredMovie: archiveFeaturedMovieSchema.nullable(),
  availableGenres: z.array(archiveGenreCountSchema),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
  nextPage: z.number().int().positive().nullable(),
  items: z.array(archiveMovieSchema),
});

export { archiveMovieSchema };
