import { z } from "zod";
import { viewerInteractionSchema } from "./shared";

const serialSeasonDetailEpisodeSchema = z.object({
  id: z.number().int().positive(),
  seasonNumber: z.number().int().nonnegative(),
  episodeNumber: z.number().int().positive(),
  name: z.string(),
  overview: z.string().nullable(),
  airDate: z.string().nullable(),
  stillPath: z.string().nullable(),
  runtimeMinutes: z.number().int().nullable(),
  runtimeLabel: z.string().nullable(),
  viewerInteraction: viewerInteractionSchema,
});

export const serialSeasonDetailSchema = z.object({
  tmdbId: z.number().int().positive(),
  season: z.object({
    id: z.number().int().positive(),
    seasonNumber: z.number().int().nonnegative(),
    name: z.string(),
    overview: z.string().nullable(),
    airDate: z.string().nullable(),
    posterPath: z.string().nullable(),
    episodeCount: z.number().int().nonnegative(),
  }),
  episodes: z.array(serialSeasonDetailEpisodeSchema),
});
