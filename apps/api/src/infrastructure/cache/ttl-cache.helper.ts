const DEFAULT_TTL_MS = 30 * 60 * 1000;
const DEFAULT_MAX_ENTRIES = 1_000;

/**
 * TTL cache + in-flight de-dupe keyed by the fetcher's arguments (or a
 * composite key derived via `keyFn`, for lookups that take more than one
 * argument), for read-mostly data that would otherwise be recomputed on
 * every request touching it.
 */
export const createTtlCache = <Args extends unknown[], T>(
  fetcher: (...args: Args) => Promise<T>,
  options: {
    keyFn?: (...args: Args) => string | number;
    ttlMs?: number;
    maxEntries?: number;
  } = {},
): ((...args: Args) => Promise<T>) => {
  const keyFn = options.keyFn ?? ((...args: Args) => args.join(":"));
  const ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  const maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;

  const cache = new Map<string | number, { value: T; expiresAt: number }>();
  const inFlight = new Map<string | number, Promise<T>>();

  const prune = (now: number): void => {
    for (const [cachedKey, cacheEntry] of cache) {
      if (cacheEntry.expiresAt <= now) {
        cache.delete(cachedKey);
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

  return async (...args: Args): Promise<T> => {
    const key = keyFn(...args);
    const now = Date.now();
    const cached = cache.get(key);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    if (cached) {
      cache.delete(key);
    }

    const inFlightRequest = inFlight.get(key);
    if (inFlightRequest) {
      return inFlightRequest;
    }

    const requestPromise = (async () => {
      const value = await fetcher(...args);
      cache.set(key, { value, expiresAt: Date.now() + ttlMs });
      prune(Date.now());
      return value;
    })();

    inFlight.set(key, requestPromise);

    try {
      return await requestPromise;
    } finally {
      inFlight.delete(key);
    }
  };
};
