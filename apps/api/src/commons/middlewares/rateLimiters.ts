import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Factories, not shared singletons — each createApp() call (one per test
// server, one per running process) gets its own in-memory counters so
// separate app instances never contaminate each other's rate-limit state.

export const createAuthLimiter = (): RateLimitRequestHandler =>
  rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });

export const createApiLimiter = (): RateLimitRequestHandler =>
  rateLimit({
    windowMs: 60 * 1000,
    max: 300,
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
export const createMutationLimiter = (): RateLimitRequestHandler =>
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => SAFE_METHODS.has(req.method),
  });
