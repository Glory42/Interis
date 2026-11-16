import type {
  TMDBWatchProvider,
  TMDBWatchProviders,
} from "../../../infrastructure/tmdb/watch-providers";
import type { WatchProvider, WatchProvidersResult } from "../types/watch-providers.types";

const toProviders = (providers: TMDBWatchProvider[]): WatchProvider[] =>
  providers
    .map((provider) => ({
      providerId: provider.provider_id,
      name: provider.provider_name,
      logoPath: provider.logo_path,
      displayPriority: provider.display_priority,
    }))
    .sort((a, b) => a.displayPriority - b.displayPriority);

const hasAnyProvider = (region: TMDBWatchProviders["results"][string]): boolean =>
  region.flatrate.length + region.free.length + region.ads.length + region.rent.length + region.buy.length > 0;

export const sliceWatchProvidersRegion = (
  response: TMDBWatchProviders,
  region: string,
): WatchProvidersResult => {
  const regionData = response.results[region];

  return {
    region,
    link: regionData?.link ?? null,
    flatrate: toProviders(regionData?.flatrate ?? []),
    free: toProviders(regionData?.free ?? []),
    ads: toProviders(regionData?.ads ?? []),
    rent: toProviders(regionData?.rent ?? []),
    buy: toProviders(regionData?.buy ?? []),
    availableRegions: Object.entries(response.results)
      .filter(([, data]) => hasAnyProvider(data))
      .map(([code]) => code)
      .sort(),
  };
};
