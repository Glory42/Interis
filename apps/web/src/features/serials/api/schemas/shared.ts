import { z } from "zod";
import { movieGenreSchema } from "@/types/api";

export const serialGenreSchema = movieGenreSchema;

export const viewerInteractionSchema = z
  .object({
    watched: z.boolean(),
    liked: z.boolean(),
    rating: z.number().nullable(),
    hasReview: z.boolean(),
  })
  .nullable();
