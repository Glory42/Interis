import { z } from "zod";
import { apiRequest, type QueryRequestOptions } from "./client";
import { unifiedSearchResultSchema, type UnifiedSearchResult } from "@/types/search";

export const searchTitles = async (
  query: string,
  options: QueryRequestOptions = {},
): Promise<UnifiedSearchResult[]> => {
  const normalized = query.trim();
  if (!normalized) return [];

  const response = await apiRequest<unknown>(`/api/search?query=${encodeURIComponent(normalized)}`, {
    signal: options.signal,
  });
  return z.array(unifiedSearchResultSchema).parse(response);
};
