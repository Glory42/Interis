import { z } from "zod";
import { apiRequest } from "@/lib/api-client";
import {
  movieSchema,
  movieLogSchema,
  tmdbSearchMovieSchema,
  type MovieLog,
  type Movie,
  type TmdbSearchMovie,
} from "@/types/api";

const movieSearchResponseSchema = z.array(tmdbSearchMovieSchema);
const movieLogsResponseSchema = z.array(movieLogSchema);

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

const archiveSortSchema = z.enum([
  "trending",
  "release_desc",
  "release_asc",
  "logs_desc",
  "rating_user_desc",
  "rating_tmdb_desc",
  "title_asc",
]);

const archivePeriodSchema = z.enum([
  "all_time",
  "this_year",
  "last_10_years",
  "this_week",
  "today",
]);

const movieDetailReviewSortSchema = z.enum(["popular", "recent"]);

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

const movieDetailResponseSchema = z.object({
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

const movieArchiveResponseSchema = z.object({
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

export type MovieArchiveSort = z.infer<typeof archiveSortSchema>;
export type MovieArchivePeriod = z.infer<typeof archivePeriodSchema>;
export type MovieDetailReviewSort = z.infer<typeof movieDetailReviewSortSchema>;

export type ArchiveMovie = z.infer<typeof archiveMovieSchema>;
export type MovieArchiveResponse = z.infer<typeof movieArchiveResponseSchema>;
export type MovieDetailResponse = z.infer<typeof movieDetailResponseSchema>;

type QueryRequestOptions = {
  signal?: AbortSignal;
};

export const searchMovies = async (
  query: string,
  options: QueryRequestOptions = {},
): Promise<TmdbSearchMovie[]> => {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length === 0) {
    return [];
  }

  const response = await apiRequest<unknown>(
    `/api/movies/search?query=${encodeURIComponent(normalizedQuery)}`,
    { method: "GET", signal: options.signal },
  );

  return movieSearchResponseSchema.parse(response);
};

export const getMovieByTmdbId = async (
  tmdbId: number,
  options: QueryRequestOptions = {},
): Promise<Movie> => {
  const response = await apiRequest<unknown>(`/api/movies/${tmdbId}`, {
    method: "GET",
    signal: options.signal,
  });

  return movieSchema.parse(response);
};

export const getRecentMovies = async (
  options: QueryRequestOptions = {},
): Promise<TmdbSearchMovie[]> => {
  const response = await apiRequest<unknown>("/api/movies/recent", {
    method: "GET",
    signal: options.signal,
  });

  return movieSearchResponseSchema.parse(response);
};

export const getMovieLogs = async (
  tmdbId: number,
  options: QueryRequestOptions = {},
): Promise<MovieLog[]> => {
  const response = await apiRequest<unknown>(`/api/movies/${tmdbId}/logs`, {
    method: "GET",
    signal: options.signal,
  });

  return movieLogsResponseSchema.parse(response);
};

export const getMovieArchive = async (
  input: {
    genre?: string;
    language?: string;
    sort?: MovieArchiveSort;
    period?: MovieArchivePeriod;
    page?: number;
    limit?: number;
  },
  options: QueryRequestOptions = {},
): Promise<MovieArchiveResponse> => {
  const searchParams = new URLSearchParams();

  if (input.genre && input.genre.trim().length > 0) {
    searchParams.set("genre", input.genre.trim());
  }

  if (input.language && input.language.trim().length > 0) {
    searchParams.set("language", input.language.trim());
  }

  if (input.sort) {
    searchParams.set("sort", input.sort);
  }

  if (input.period) {
    searchParams.set("period", input.period);
  }

  if (typeof input.page === "number" && Number.isFinite(input.page)) {
    searchParams.set("page", String(Math.max(1, Math.floor(input.page))));
  }

  if (typeof input.limit === "number" && Number.isFinite(input.limit)) {
    searchParams.set("limit", String(Math.max(1, Math.floor(input.limit))));
  }

  const query = searchParams.toString();
  const path = query ? `/api/movies/archive?${query}` : "/api/movies/archive";

  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });

  return movieArchiveResponseSchema.parse(response);
};

export const getMovieDetail = async (
  tmdbId: number,
  input: {
    reviewsSort?: MovieDetailReviewSort;
  } = {},
  options: QueryRequestOptions = {},
): Promise<MovieDetailResponse> => {
  const searchParams = new URLSearchParams();

  if (input.reviewsSort) {
    searchParams.set("reviewsSort", input.reviewsSort);
  }

  const query = searchParams.toString();
  const path = query
    ? `/api/movies/${tmdbId}/detail?${query}`
    : `/api/movies/${tmdbId}/detail`;

  const response = await apiRequest<unknown>(path, {
    method: "GET",
    signal: options.signal,
    cache: "no-store",
  });

  return movieDetailResponseSchema.parse(response);
};
