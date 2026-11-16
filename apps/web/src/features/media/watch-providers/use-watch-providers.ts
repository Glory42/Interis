import { useQuery } from "@tanstack/react-query";
import type { MediaKind } from "@/features/media/cache/media-events";
import { getWatchProviders } from "./api";

export const watchProviderKeys = {
  all: ["watch-providers"] as const,
  detail: (kind: MediaKind, tmdbId: number, region: string) => ["watch-providers", kind, tmdbId, region] as const,
};

// The server caches TMDB for 12h; nothing the viewer does changes it.
const WATCH_PROVIDERS_STALE_MS = 60 * 60 * 1000;

export const useWatchProviders = (kind: MediaKind, tmdbId: number, region: string, enabled: boolean) =>
  useQuery({
    queryKey: watchProviderKeys.detail(kind, tmdbId, region),
    queryFn: ({ signal }) => getWatchProviders(kind, tmdbId, region, signal),
    enabled,
    staleTime: WATCH_PROVIDERS_STALE_MS,
    // Switching region keeps this title's logos up until the new ones arrive.
    placeholderData: (previous, previousQuery) => (previousQuery?.queryKey[2] === tmdbId ? previous : undefined),
  });
