import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import { env } from "../../infrastructure/config/env";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Factories, not shared singletons — each createApp() call (one per test
// server, one per running process) gets its own in-memory counters so
// separate app instances never contaminate each other's rate-limit state.
//
// Production ceilings are the real security limits. Under NODE_ENV=test the
// integration suite runs many test files' worth of sequential requests
// against one createApp() instance per file in a single `bun test` process -
// far more volume than a real client would ever produce in a minute - so
// each factory defaults to a relaxed test ceiling unless a caller explicitly
// passes `max` (see tests/integration/security/rate-limits.test.ts, which
// opts back into the production ceilings to test the limiters themselves).

const AUTH_LIMIT_PRODUCTION = 30;
const AUTH_LIMIT_TEST = 1000;
const API_LIMIT_PRODUCTION = 300;
const API_LIMIT_TEST = 5000;
const MUTATION_LIMIT_PRODUCTION = 60;
const MUTATION_LIMIT_TEST = 1000;

const resolveMax = (production: number, test: number, override?: number): number => {
  if (override !== undefined) {
    return override;
  }

  return env.NODE_ENV === "test" ? test : production;
};

export const createAuthLimiter = (max?: number): RateLimitRequestHandler =>
  rateLimit({
    windowMs: 60 * 1000,
    max: resolveMax(AUTH_LIMIT_PRODUCTION, AUTH_LIMIT_TEST, max),
    standardHeaders: true,
    legacyHeaders: false,
  });

export const createApiLimiter = (max?: number): RateLimitRequestHandler =>
  rateLimit({
    windowMs: 60 * 1000,
    max: resolveMax(API_LIMIT_PRODUCTION, API_LIMIT_TEST, max),
    standardHeaders: true,
    legacyHeaders: false,
    // public.routes.ts already applies its own dedicated limiter.
    skip: (req) => req.path.startsWith("/public/"),
  });

/**
 * Extra ceiling on state-changing requests specifically, layered on top of
 * apiLimiter, to blunt spam/brute-force writes (e.g. mass review/list
 * creation) without throttling read-heavy browsing.
 */
export const createMutationLimiter = (max?: number): RateLimitRequestHandler =>
  rateLimit({
    windowMs: 60 * 1000,
    max: resolveMax(MUTATION_LIMIT_PRODUCTION, MUTATION_LIMIT_TEST, max),
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => SAFE_METHODS.has(req.method),
  });
