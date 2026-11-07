import { z } from "zod";
import { seriesGenreSchema } from "./shared";

export const seriesArchiveItemSchema = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  firstAirDate: z.string().nullable(),
  firstAirYear: z.number().int().nullable(),
  creator: z.string().nullable(),
  network: z.string().nullable(),
  languageCode: z.string().nullable(),
  genres: z.array(seriesGenreSchema),
  primaryGenre: z.string().nullable(),
  logCount: z.number().int().nonnegative(),
  avgRatingOutOfTen: z.number().nullable(),
  tmdbRatingOutOfTen: z.number().nullable(),
  ratedLogCount: z.number().int().nonnegative(),
  numberOfEpisodes: z.number().int().nullable(),
  viewerHasLogged: z.boolean(),
  viewerWatchlisted: z.boolean(),
  viewerFullyWatched: z.boolean(),
  viewerHasProgress: z.boolean(),
});

const seriesArchiveFeaturedSchema = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  firstAirDate: z.string().nullable(),
  firstAirYear: z.number().int().nullable(),
  creator: z.string().nullable(),
  network: z.string().nullable(),
});

const seriesArchiveGenreCountSchema = z.object({
  id: z.number().int().nullable().optional(),
  name: z.string(),
  count: z.number().int().nonnegative().nullable(),
});

export const seriesArchiveSortSchema = z.enum([
  "trending",
  "first_air_desc",
  "first_air_asc",
  "logs_desc",
  "rating_user_desc",
  "rating_tmdb_desc",
  "title_asc",
]);

export const seriesArchivePeriodSchema = z.enum([
  "all_time",
  "this_year",
  "last_10_years",
  "this_week",
  "today",
]);

export const seriesArchiveResponseSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  filteredCount: z.number().int().nonnegative(),
  selectedGenre: z.string().nullable(),
  selectedLanguage: z.string().nullable(),
  selectedSort: seriesArchiveSortSchema,
  selectedPeriod: seriesArchivePeriodSchema,
  featuredSeries: seriesArchiveFeaturedSchema.nullable(),
  availableGenres: z.array(seriesArchiveGenreCountSchema),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
  nextPage: z.number().int().positive().nullable(),
  items: z.array(seriesArchiveItemSchema),
});
