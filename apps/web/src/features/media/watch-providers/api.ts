import { z } from "zod";
import { apiRequest } from "@/lib/api-client";
import type { MediaKind } from "@/features/media/cache/media-events";

const watchProviderSchema = z.object({
  providerId: z.number(),
  name: z.string(),
  logoPath: z.string().nullable(),
  displayPriority: z.number(),
});

export const watchProvidersSchema = z.object({
  region: z.string(),
  link: z.string().nullable(),
  flatrate: z.array(watchProviderSchema),
  free: z.array(watchProviderSchema),
  ads: z.array(watchProviderSchema),
  rent: z.array(watchProviderSchema),
  buy: z.array(watchProviderSchema),
  availableRegions: z.array(z.string()),
});

export type WatchProvider = z.infer<typeof watchProviderSchema>;
export type WatchProviders = z.infer<typeof watchProvidersSchema>;

const pathPrefix: Record<MediaKind, string> = { film: "/api/movies", tv: "/api/serials" };

export const getWatchProviders = async (
  kind: MediaKind,
  tmdbId: number,
  region: string,
  signal?: AbortSignal,
): Promise<WatchProviders> => {
  const response = await apiRequest<unknown>(
    `${pathPrefix[kind]}/${tmdbId}/watch-providers?region=${encodeURIComponent(region)}`,
    { method: "GET", signal },
  );
  return watchProvidersSchema.parse(response);
};
