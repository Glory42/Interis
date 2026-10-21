import type { NextFunction, Request, Response } from "express";

type CachedPublicResponse = {
  status: number;
  body: unknown;
  cacheControl: string | null;
  expiresAt: number;
};

const CACHEABLE_STATUSES = new Set([200, 404]);

// In-process cache of whole public-widget responses keyed by URL. Widgets on external
// sites re-request the same few URLs on every page view; serving repeats from memory
// means that traffic doesn't wake the DB (Neon compute only sleeps after 5 idle min).
// Responses are viewer-independent (no cookies/auth on /api/public), so sharing is safe.
export const createPublicResponseCache = (options: { ttlMs: number; maxEntries: number }) => {
  const cache = new Map<string, CachedPublicResponse>();

  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method !== "GET" || options.ttlMs <= 0) {
      next();
      return;
    }

    const key = req.originalUrl;
    const now = Date.now();
    const hit = cache.get(key);
    if (hit && hit.expiresAt > now) {
      res.setHeader("X-Cache", "HIT");
      if (hit.cacheControl) res.setHeader("Cache-Control", hit.cacheControl);
      res.status(hit.status).json(hit.body);
      return;
    }
    cache.delete(key);

    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      if (CACHEABLE_STATUSES.has(res.statusCode)) {
        if (cache.size >= options.maxEntries) {
          const oldestKey = cache.keys().next().value;
          if (oldestKey !== undefined) cache.delete(oldestKey);
        }
        const cacheControl = res.getHeader("Cache-Control");
        cache.set(key, {
          status: res.statusCode,
          body,
          cacheControl: typeof cacheControl === "string" ? cacheControl : null,
          expiresAt: now + options.ttlMs,
        });
      }
      res.setHeader("X-Cache", "MISS");
      return originalJson(body);
    };

    next();
  };
};
