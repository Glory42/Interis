import { z } from "zod";
import { serialGenreSchema } from "./shared";

export const cachedSeriesSchema = z
  .object({
    id: z.number().int().positive(),
    tmdbId: z.number().int().positive(),
    title: z.string(),
    originalTitle: z.string().nullable(),
    posterPath: z.string().nullable(),
    backdropPath: z.string().nullable(),
    firstAirDate: z.string().nullable(),
    firstAirYear: z.number().int().nullable(),
    lastAirDate: z.string().nullable(),
    creator: z.string().nullable(),
    network: z.string().nullable(),
    episodeRuntime: z.number().int().nullable(),
    numberOfSeasons: z.number().int().nullable(),
    numberOfEpisodes: z.number().int().nullable(),
    status: z.string().nullable(),
    overview: z.string().nullable(),
    tagline: z.string().nullable(),
    languageCode: z.string().nullable(),
    genres: z.array(serialGenreSchema).nullish(),
    cachedAt: z.string(),
  })
  .passthrough();

export const trendingSeriesSchema = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string(),
  posterPath: z.string().nullable(),
  firstAirYear: z.number().int().nullable(),
});

export const trendingSeriesListSchema = z.array(trendingSeriesSchema);

export const serialDiaryEntrySchema = z.object({
  id: z.string(),
  watchedDate: z.string(),
  rating: z.number().nullable(),
  rewatch: z.boolean(),
  seriesId: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  seriesTmdbId: z.number().int(),
  seriesTitle: z.string(),
  seriesPosterPath: z.string().nullable(),
  seriesFirstAirYear: z.number().int().nullable(),
  reviewId: z.string().nullable(),
  reviewContent: z.string().nullable(),
  reviewContainsSpoilers: z.boolean().nullable(),
  reviewCreatedAt: z.string().nullable(),
});

export const serialDiaryListSchema = z.array(serialDiaryEntrySchema);

export const updateSerialLogInputSchema = z.object({
  watchedDate: z.string().optional(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
  rewatch: z.boolean().optional(),
});

export const serialLogSchema = z.object({
  diaryEntryId: z.string(),
  watchedDate: z.string(),
  rating: z.number().nullable(),
  rewatch: z.boolean(),
  createdAt: z.string(),
  username: z.string(),
  userDisplayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  reviewContent: z.string().nullable(),
  reviewContainsSpoilers: z.boolean().nullable(),
  reviewUpdatedAt: z.string().nullable(),
});

export const serialLogsListSchema = z.array(serialLogSchema);
