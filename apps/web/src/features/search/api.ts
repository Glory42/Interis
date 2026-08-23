import { z } from "zod";
import { apiRequest } from "@/lib/api-client";
import type { QueryRequestOptions } from "@/features/films/api";
import { mediaTypeSchema } from "@/types/api";

export const unifiedSearchResultSchema = z.object({
  mediaType: mediaTypeSchema,
  tmdbId: z.number(),
  title: z.string(),
  posterPath: z.string().nullable(),
  releaseDate: z.string().nullable(),
  popularity: z.number(),
});

export type UnifiedSearchResult = z.infer<typeof unifiedSearchResultSchema>;

const unifiedSearchResponseSchema = z.array(unifiedSearchResultSchema);

export const searchTitles = async (
  query: string,
  options: QueryRequestOptions = {},
): Promise<UnifiedSearchResult[]> => {
  const normalizedQuery = query.trim();
  if (normalizedQuery.length === 0) {
    return [];
  }

  const response = await apiRequest<unknown>(
    `/api/search?query=${encodeURIComponent(normalizedQuery)}`,
    { method: "GET", signal: options.signal },
  );

  return unifiedSearchResponseSchema.parse(response);
};
