const TMDB_ENTITY_CACHE_TTL_MS = 30 * 60 * 1000;
const TMDB_ENTITY_CACHE_MAX_ENTRIES = 1_000;

/**
 * TTL cache + in-flight de-dupe keyed by tmdbId, for read-mostly TMDB
 * lookups (detail/credits/similar) that would otherwise be re-fetched live
 * on every request touching that entity (e.g. a movie/series detail page
 * refetch triggered by an unrelated interaction update).
 */
export const createCachedTmdbFetcher = <T>(
  fetcher: (tmdbId: number) => Promise<T>,
  ttlMs: number = TMDB_ENTITY_CACHE_TTL_MS,
  maxEntries: number = TMDB_ENTITY_CACHE_MAX_ENTRIES,
): ((tmdbId: number) => Promise<T>) => {
  const cache = new Map<number, { value: T; expiresAt: number }>();
  const inFlight = new Map<number, Promise<T>>();

  const prune = (now: number): void => {
    for (const [cachedTmdbId, cacheEntry] of cache) {
      if (cacheEntry.expiresAt <= now) {
        cache.delete(cachedTmdbId);
      }
    }

    if (cache.size <= maxEntries) {
      return;
    }

    const overflow = cache.size - maxEntries;
    const cacheKeys = cache.keys();

    for (let index = 0; index < overflow; index += 1) {
      const nextKey = cacheKeys.next();
      if (nextKey.done) {
        break;
      }

      cache.delete(nextKey.value);
    }
  };

  return async (tmdbId: number): Promise<T> => {
    const now = Date.now();
    const cached = cache.get(tmdbId);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    if (cached) {
      cache.delete(tmdbId);
    }

    const inFlightRequest = inFlight.get(tmdbId);
    if (inFlightRequest) {
      return inFlightRequest;
    }

    const requestPromise = (async () => {
      const value = await fetcher(tmdbId);
      cache.set(tmdbId, { value, expiresAt: Date.now() + ttlMs });
      prune(Date.now());
      return value;
    })();

    inFlight.set(tmdbId, requestPromise);

    try {
      return await requestPromise;
    } finally {
      inFlight.delete(tmdbId);
    }
  };
};
