import { fetchTMDB } from "./base-client";
import { createCachedTmdbFetcher } from "./tmdb-cache.helper";
import {
  TMDBWatchProvidersSchema,
  type TMDBWatchProviders,
} from "./dto/watch-providers-response.dto";

export type {
  TMDBWatchProvider,
  TMDBWatchProviders,
  TMDBWatchProvidersRegion,
} from "./dto/watch-providers-response.dto";

// Availability changes rarely; one all-regions response per title serves every region.
const WATCH_PROVIDERS_CACHE_TTL_MS = 12 * 60 * 60 * 1000;

const fetchWatchProviders = async (path: string): Promise<TMDBWatchProviders> => {
  try {
    return TMDBWatchProvidersSchema.parse(await fetchTMDB(path));
  } catch (error) {
    // An id TMDB doesn't know has no providers anywhere.
    if (error instanceof Error && error.message.startsWith("TMDB Error: 404")) {
      return { results: {} };
    }
    throw error;
  }
};

export const getFilmWatchProviders = createCachedTmdbFetcher(
  (tmdbId: number) => fetchWatchProviders(`/movie/${tmdbId}/watch/providers`),
  { ttlMs: WATCH_PROVIDERS_CACHE_TTL_MS },
);

export const getSeriesWatchProviders = createCachedTmdbFetcher(
  (tmdbId: number) => fetchWatchProviders(`/tv/${tmdbId}/watch/providers`),
  { ttlMs: WATCH_PROVIDERS_CACHE_TTL_MS },
);
