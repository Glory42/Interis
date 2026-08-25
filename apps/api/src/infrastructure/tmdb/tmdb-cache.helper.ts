import { createTtlCache } from "../cache/ttl-cache.helper";

const TMDB_ENTITY_CACHE_TTL_MS = 30 * 60 * 1000;
const TMDB_ENTITY_CACHE_MAX_ENTRIES = 1_000;

/**
 * TTL cache + in-flight de-dupe keyed by tmdbId (or a composite key derived
 * via `keyFn`, for lookups that take more than one argument such as a
 * season endpoint keyed by tmdbId + season number), for read-mostly TMDB
 * lookups (detail/credits/similar) that would otherwise be re-fetched live
 * on every request touching that entity (e.g. a movie/series detail page
 * refetch triggered by an unrelated interaction update).
 */
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
