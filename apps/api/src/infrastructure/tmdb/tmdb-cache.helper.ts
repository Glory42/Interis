import { createTtlCache } from "../cache/ttl-cache.helper";

const TMDB_ENTITY_CACHE_TTL_MS = 30 * 60 * 1000;
const TMDB_ENTITY_CACHE_MAX_ENTRIES = 1_000;

// Avoids re-fetching TMDB on every request that touches an entity (e.g. a
// detail-page refetch triggered by an unrelated interaction update).
export const createCachedTmdbFetcher = <Args extends unknown[], T>(
  fetcher: (...args: Args) => Promise<T>,
  options: {
    keyFn?: (...args: Args) => string | number;
    ttlMs?: number;
    maxEntries?: number;
  } = {},
): ((...args: Args) => Promise<T>) =>
  createTtlCache(fetcher, {
    ttlMs: TMDB_ENTITY_CACHE_TTL_MS,
    maxEntries: TMDB_ENTITY_CACHE_MAX_ENTRIES,
    ...options,
  });
