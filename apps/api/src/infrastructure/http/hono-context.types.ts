import { Hono, type MiddlewareHandler } from "hono";
import type { AuthUser, RequestSession } from "../../modules/auth/types/auth.types";
import { onError } from "../../commons/errors/onError.hono";
import {
  createBodyLimitMiddleware,
  defaultBodyLimitMiddleware,
} from "../../commons/middlewares/bodyLimit.hono";

export type AppVariables = {
  user: AuthUser;
  session: RequestSession;
};

export type AppEnv = {
  Variables: AppVariables;
};

const BODYLESS_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// A handler that returns early without reading the body (e.g. rejecting a
// bad :id before checking the payload) leaves it undrained, which can hang
// the connection and, in turn, server.close() during test teardown.
// c.req.json() caches its result, so pre-draining here is free for any
// handler that reads it again.
const drainRequestBody: MiddlewareHandler = async (c, next) => {
  if (!BODYLESS_METHODS.has(c.req.method)) {
    await c.req.json().catch(() => undefined);
  }
  await next();
};

// Every module's Hono app should be created via this factory so they all
// share the same Variables typing (user/session), error handling (AppError,
// malformed JSON, generic 500), a 1mb body-size cap, and body draining.
export const createHonoApp = (options?: { bodyLimitBytes?: number }): Hono<AppEnv> => {
  const app = new Hono<AppEnv>();
  app.onError(onError);
  app.use(
    options?.bodyLimitBytes
      ? createBodyLimitMiddleware(options.bodyLimitBytes)
      : defaultBodyLimitMiddleware,
  );
  app.use(drainRequestBody);
  return app;
};
