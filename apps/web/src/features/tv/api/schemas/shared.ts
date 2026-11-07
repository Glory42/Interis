import { z } from "zod";
import { filmGenreSchema } from "@/types/api";

export const seriesGenreSchema = filmGenreSchema;

export const viewerInteractionSchema = z
  .object({
    watched: z.boolean(),
    liked: z.boolean(),
    rating: z.number().nullable(),
    hasReview: z.boolean(),
    // Seasons only: how many of their episodes you've watched.
    watchedEpisodeCount: z.number().int().nonnegative().optional(),
  })
  .nullable();
