import { z } from "zod";
import { mediaTypeSchema } from "./common";

export const unifiedSearchResultSchema = z.object({
  mediaType: mediaTypeSchema,
  tmdbId: z.number(),
  title: z.string(),
  posterPath: z.string().nullable(),
  releaseDate: z.string().nullable(),
  popularity: z.number(),
});

export type UnifiedSearchResult = z.infer<typeof unifiedSearchResultSchema>;
