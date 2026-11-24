import { z } from "zod";
import {
  archiveGenreCountSchema,
  archivePeriodSchema,
  genreSchema,
  personLinkSchema,
  ratingBreakdownSchema,
  reviewSortSchema,
  userSummarySchema,
  viewerUserRatingSchema,
} from "./common";

export const movieArchiveSortSchema = z.enum([
  "trending",
  "release_desc",
  "release_asc",
  "logs_desc",
  "rating_user_desc",
  "rating_tmdb_desc",
  "title_asc",
]);
export type MovieArchiveSort = z.infer<typeof movieArchiveSortSchema>;

export const archiveMovieSchema = z.object({
  tmdbId: z.number().int(),
  title: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  releaseDate: z.string().nullable(),
  releaseYear: z.number().int().nullable(),
  director: z.string().nullable(),
  languageCode: z.string().nullable(),
  genres: z.array(genreSchema),
  primaryGenre: z.string().nullable(),
  logCount: z.number().int().nonnegative(),
  avgRatingOutOfTen: z.number().nullable(),
  tmdbRatingOutOfTen: z.number().nullable(),
  ratedLogCount: z.number().int().nonnegative(),
  viewerHasLogged: z.boolean(),
  viewerWatchlisted: z.boolean(),
});

export const movieArchiveResponseSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  filteredCount: z.number().int().nonnegative(),
  selectedGenre: z.string().nullable(),
  selectedSort: movieArchiveSortSchema,
  selectedPeriod: archivePeriodSchema,
  availableGenres: z.array(archiveGenreCountSchema),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
  nextPage: z.number().int().positive().nullable(),
  items: z.array(archiveMovieSchema),
});

export const mediaReviewSchema = z.object({
  id: z.string(),
  content: z.string(),
  containsSpoilers: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  watchedDate: z.string().nullable(),
  rating: z.number().nullable(),
  likeCount: z.number().int().nonnegative(),
  viewerHasLiked: z.boolean(),
  author: userSummarySchema,
  context: z
    .object({
      seasonNumber: z.number().int(),
      episodeNumber: z.number().int().nullable(),
      episodeName: z.string().nullable(),
    })
    .nullable()
    .optional(),
});

export const movieDetailResponseSchema = z.object({
  movie: z.object({
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
    genres: z.array(genreSchema),
    languageCode: z.string().nullable(),
    productionCountries: z.array(z.string()),
    budget: z.number().nullable(),
    revenue: z.number().nullable(),
    globalRating: z.number().nullable(),
    globalRatingVoteCount: z.number().int().nullable(),
  }),
  logsCount: z.number().int().nonnegative(),
  reviewCount: z.number().int().nonnegative(),
  userRating: viewerUserRatingSchema,
  reviewsSort: reviewSortSchema,
  reviews: z.array(mediaReviewSchema),
  reviewsHasMore: z.boolean(),
  ratingBreakdown: ratingBreakdownSchema,
  similar: z.array(
    z.object({
      tmdbId: z.number().int(),
      title: z.string(),
      posterPath: z.string().nullable(),
      releaseYear: z.number().int().nullable(),
    }),
  ),
});

export const movieInteractionSchema = z
  .object({
    liked: z.boolean(),
    watchlisted: z.boolean(),
    rating: z.number().nullable(),
    watched: z.boolean(),
  })
  .passthrough();

export type ArchiveMovie = z.infer<typeof archiveMovieSchema>;
export type MovieArchiveResponse = z.infer<typeof movieArchiveResponseSchema>;
export type MovieDetailResponse = z.infer<typeof movieDetailResponseSchema>;
export type MediaReview = z.infer<typeof mediaReviewSchema>;
export type MovieInteraction = z.infer<typeof movieInteractionSchema>;
export type UpdateMovieInteractionInput = Partial<Omit<MovieInteraction, "rating">> & {
  rating?: number | null;
};
