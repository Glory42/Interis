import { z } from "zod";

export const diaryItemSchema = z.object({
  id: z.string(),
  mediaType: z.enum(["movie", "tv"]),
  watchedDate: z.string(),
  rating: z.number().nullable(),
  rewatch: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  media: z.object({
    tmdbId: z.number().int(),
    title: z.string(),
    posterPath: z.string().nullable(),
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
