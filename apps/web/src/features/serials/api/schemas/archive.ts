import { z } from "zod";
import { serialGenreSchema } from "./shared";

export const serialArchiveItemSchema = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  firstAirDate: z.string().nullable(),
  firstAirYear: z.number().int().nullable(),
  creator: z.string().nullable(),
  network: z.string().nullable(),
  languageCode: z.string().nullable(),
  genres: z.array(serialGenreSchema),
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

const serialArchiveFeaturedSchema = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  firstAirDate: z.string().nullable(),
  firstAirYear: z.number().int().nullable(),
  creator: z.string().nullable(),
  network: z.string().nullable(),
});

const serialArchiveGenreCountSchema = z.object({
  id: z.number().int().nullable().optional(),
  name: z.string(),
  count: z.number().int().nonnegative().nullable(),
});

export const serialArchiveSortSchema = z.enum([
  "trending",
  "first_air_desc",
  "first_air_asc",
  "logs_desc",
  "rating_user_desc",
  "rating_tmdb_desc",
  "title_asc",
]);

export const serialArchivePeriodSchema = z.enum([
  "all_time",
  "this_year",
  "last_10_years",
  "this_week",
  "today",
]);

export const serialArchiveResponseSchema = z.object({
  totalCount: z.number().int().nonnegative(),
  filteredCount: z.number().int().nonnegative(),
  selectedGenre: z.string().nullable(),
  selectedLanguage: z.string().nullable(),
  selectedSort: serialArchiveSortSchema,
  selectedPeriod: serialArchivePeriodSchema,
  featuredSeries: serialArchiveFeaturedSchema.nullable(),
  availableGenres: z.array(serialArchiveGenreCountSchema),
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  hasMore: z.boolean(),
  nextPage: z.number().int().positive().nullable(),
  items: z.array(serialArchiveItemSchema),
});
