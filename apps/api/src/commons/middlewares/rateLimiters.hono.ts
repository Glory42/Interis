import type { Context, MiddlewareHandler, Next } from "hono";
import { env } from "../../infrastructure/config/env";

// No Hono/express-rate-limit equivalent package exists — hand-rolled
// fixed-window in-memory limiter, per-factory-call counters.

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const AUTH_LIMIT_PRODUCTION = 30;
const AUTH_LIMIT_TEST = 1000;
const API_LIMIT_PRODUCTION = 300;
const API_LIMIT_TEST = 5000;
const MUTATION_LIMIT_PRODUCTION = 60;
const MUTATION_LIMIT_TEST = 1000;
const PUBLIC_LIMIT = 60;

const WINDOW_MS = 60 * 1000;

const resolveMax = (production: number, test: number, override?: number): number => {
  if (override !== undefined) {
    return override;
  }

  return env.NODE_ENV === "test" ? test : production;
};

const RATE_LIMIT_BODY = {
  error: { message: "Too many requests, please try again later.", code: "TOO_MANY_REQUESTS" },
};

// No trust-proxy config exists in this app (matches the pre-port Express
// setup) — X-Forwarded-For if present, otherwise every client collapses
// into one shared bucket, same effective behavior local/test traffic saw
// under Express's unconfigured req.ip.
const getClientKey = (c: Context): string =>
  c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

type Bucket = { count: number; resetAt: number };

const createLimiterMiddleware = (
  max: number,
  skip?: (c: Context) => boolean,
): MiddlewareHandler => {
  const buckets = new Map<string, Bucket>();

  return async (c: Context, next: Next) => {
    if (skip?.(c)) {
      await next();
      return;
    }

    const key = getClientKey(c);
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + WINDOW_MS };
      buckets.set(key, bucket);
    }

    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    const resetSeconds = Math.ceil((bucket.resetAt - now) / 1000);

    c.header("RateLimit-Policy", `${max};w=${WINDOW_MS / 1000}`);
    c.header("RateLimit-Limit", String(max));
    c.header("RateLimit-Remaining", String(remaining));
    c.header("RateLimit-Reset", String(resetSeconds));

    if (bucket.count > max) {
      return c.json(RATE_LIMIT_BODY, 429);
    }

    await next();
  };
};

export const createAuthLimiter = (max?: number): MiddlewareHandler =>
  createLimiterMiddleware(resolveMax(AUTH_LIMIT_PRODUCTION, AUTH_LIMIT_TEST, max));

export const createApiLimiter = (max?: number): MiddlewareHandler =>
  createLimiterMiddleware(
    resolveMax(API_LIMIT_PRODUCTION, API_LIMIT_TEST, max),
    // public.routes.ts already applies its own dedicated limiter.
    (c) => c.req.path.startsWith("/api/public/"),
  );

/**
 * Extra ceiling on state-changing requests specifically, layered on top of
 * apiLimiter, to blunt spam/brute-force writes (e.g. mass review/list
 * creation) without throttling read-heavy browsing.
 */
export const createMutationLimiter = (max?: number): MiddlewareHandler =>
  createLimiterMiddleware(
    resolveMax(MUTATION_LIMIT_PRODUCTION, MUTATION_LIMIT_TEST, max),
    (c) => SAFE_METHODS.has(c.req.method),
  );

// The portfolio widget can hammer this — no test-env relaxation, matches
// the original express-rate-limit config for public.routes.ts exactly.
export const createPublicLimiter = (): MiddlewareHandler =>
  createLimiterMiddleware(PUBLIC_LIMIT);
