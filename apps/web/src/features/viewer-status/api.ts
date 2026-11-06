import { z } from "zod";
import { apiRequest, type QueryRequestOptions } from "@/lib/api-client";
import { mediaTypeSchema } from "@/types/api";

const viewerStatusSchema = z.object({
  mediaType: mediaTypeSchema,
  tmdbId: z.number().int(),
  watched: z.boolean(),
  rating: z.number().nullable(),
  liked: z.boolean(),
  watchlisted: z.boolean(),
  episodes: z.object({ watched: z.number().int(), total: z.number().int().nullable() }).nullable(),
});

export type ViewerStatus = z.infer<typeof viewerStatusSchema>;
export type ViewerStatusItem = Pick<ViewerStatus, "mediaType" | "tmdbId">;

export const viewerStatusKey = (item: ViewerStatusItem): string => `${item.mediaType}:${item.tmdbId}`;

export const getViewerStatuses = async (
  itemsParam: string,
  options: QueryRequestOptions = {},
): Promise<ViewerStatus[]> => {
  const response = await apiRequest<unknown>(
    `/api/viewer-status?items=${encodeURIComponent(itemsParam)}`,
    { method: "GET", signal: options.signal },
  );
  return z.object({ items: z.array(viewerStatusSchema) }).parse(response).items;
};
