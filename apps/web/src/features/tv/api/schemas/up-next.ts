import { z } from "zod";

const upNextSeriesSchema = z.object({
  tmdbId: z.number().int(),
  title: z.string(),
  posterPath: z.string().nullable(),
  backdropPath: z.string().nullable(),
});

const upNextEpisodeSchema = z.object({
  seasonNumber: z.number().int().nonnegative(),
  episodeNumber: z.number().int().nonnegative(),
  name: z.string(),
  stillPath: z.string().nullable(),
  airDate: z.string().nullable(),
  runtime: z.number().int().nullable(),
});

const upNextItemSchema = z.object({
  series: upNextSeriesSchema,
  episode: upNextEpisodeSchema,
  seasonEpisodeCount: z.number().int().nullable(),
  watchedEpisodesCount: z.number().int().nonnegative(),
  numberOfEpisodes: z.number().int().nullable(),
  lastWatchedAt: z.string().nullable(),
  newEpisodesCount: z.number().int().nonnegative(),
});

const airingSoonEpisodeSchema = z.object({
  series: upNextSeriesSchema,
  episode: upNextEpisodeSchema,
  source: z.enum(["watching", "watchlist"]),
});

export const upNextResponseSchema = z.object({
  today: z.string(),
  upNext: z.array(upNextItemSchema),
  airingSoon: z.array(z.object({ date: z.string(), episodes: z.array(airingSoonEpisodeSchema) })),
});

export type UpNextResponse = z.infer<typeof upNextResponseSchema>;
export type UpNextItem = z.infer<typeof upNextItemSchema>;
export type AiringSoonEpisode = z.infer<typeof airingSoonEpisodeSchema>;
