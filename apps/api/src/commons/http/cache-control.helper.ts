import type { IncomingHttpHeaders } from "node:http";
import type { Response } from "express";
import { env } from "../../infrastructure/config/env";
import { parseCookie } from "../../modules/auth/helpers/auth-cookies.helper";

export type PublicCacheOptions = {
  // Browser cache lifetime, in seconds.
  maxAge: number;
  // Shared-cache (Cloudflare) lifetime, in seconds; defaults to maxAge.
  sMaxAge?: number;
};

// The same for every viewer: browsers and shared caches may keep it.
export const publicCache = (res: Response, options: PublicCacheOptions): void => {
  // No stale-while-revalidate: Cloudflare ignores it whenever s-maxage is set.
  res.setHeader(
    "Cache-Control",
    `public, max-age=${options.maxAge}, s-maxage=${options.sMaxAge ?? options.maxAge}`,
  );
};

// Embeds viewer state (or might): never stored by any cache.
export const privateNoStore = (res: Response): void => {
  res.setHeader("Cache-Control", "private, no-store");
};

// Any Request shape: only the headers are read.
type WithHeaders = { headers: IncomingHttpHeaders };

export const hasAuthCookie = (req: WithHeaders): boolean =>
  parseCookie(req.headers.cookie, env.AUTH_ACCESS_COOKIE_NAME) !== null ||
  parseCookie(req.headers.cookie, env.AUTH_REFRESH_COOKIE_NAME) !== null;

/**
 * For responses that embed viewer state when someone is signed in. A request
 * carrying no auth cookie gets the anonymous body, which only shared caches
 * may keep (browser max-age 0, so signing in never shows a stale copy).
 */
export const anonymousPublicCache = (
  req: WithHeaders,
  res: Response,
  options: { sMaxAge: number },
): void => {
  res.vary("Cookie");
  if (hasAuthCookie(req)) {
    privateNoStore(res);
    return;
  }
  publicCache(res, { maxAge: 0, ...options });
};
