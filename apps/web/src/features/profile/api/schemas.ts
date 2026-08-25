import { z } from "zod";
import { mediaTypeSchema } from "@/types/api";

export const diaryItemSchema = z.object({
  id: z.string(),
  mediaType: mediaTypeSchema,
  watchedDate: z.string(),
  rating: z.number().nullable(),
  rewatch: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  media: z.object({
    tmdbId: z.number().int().nullable(),
    mbid: z.string().nullable().optional(),
    volumeId: z.string().nullable().optional(),
    title: z.string(),
    posterPath: z.string().nullable().optional(),
    coverArtUrl: z.string().nullable().optional(),
    artistName: z.string().nullable().optional(),
    authors: z.array(z.string()).nullable().optional(),
    releaseYear: z.number().int().nullable(),
  }),
  review: z
    .object({
      id: z.string(),
      content: z.string(),
      containsSpoilers: z.boolean(),
      createdAt: z.string(),
    })
    .nullable(),
});

export const diaryItemListSchema = z.array(diaryItemSchema);

export type DiaryItem = z.infer<typeof diaryItemSchema>;

export const currentlyWatchingSeriesSchema = z.object({
  tmdbId: z.number().int(),
  title: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
  firstAirYear: z.number().int().nullable(),
  numberOfSeasons: z.number().int().nullable(),
  numberOfEpisodes: z.number().int().nullable(),
  watchedEpisodesCount: z.number().int(),
  progressPercent: z.number(),
  lastWatchedAt: z.string(),
  currentEpisode: z
    .object({
      seasonNumber: z.number().int(),
      episodeNumber: z.number().int(),
      name: z.string(),
    })
    .nullable(),
});

export const currentlyWatchingListSchema = z.array(currentlyWatchingSeriesSchema);

export type CurrentlyWatchingSeries = z.infer<typeof currentlyWatchingSeriesSchema>;
