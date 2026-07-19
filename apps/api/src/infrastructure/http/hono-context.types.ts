import { Hono, type MiddlewareHandler } from "hono";
import type { AuthUser, RequestSession } from "../../modules/auth/types/auth.types";
import { onError } from "../../commons/errors/onError.hono";
import { defaultBodyLimitMiddleware } from "../../commons/middlewares/bodyLimit.hono";

export type AppVariables = {
  user: AuthUser;
  session: RequestSession;
};

export type AppEnv = {
  Variables: AppVariables;
};

const BODYLESS_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

// Hono reads the request body lazily (c.req.json(), called by whichever
// handler needs it) — Express always parses/drains it eagerly via global
// middleware regardless of what the controller ends up doing. A handler
// that validates params and returns an error before ever reading the body
// (e.g. rejecting a bad :id before checking the payload) leaves that body
// stream undrained, which can hang the underlying connection and, in turn,
// server.close() during test teardown. c.req.json() caches its result, so
// pre-draining here is free for any handler that reads it again.
const drainRequestBody: MiddlewareHandler = async (c, next) => {
  if (!BODYLESS_METHODS.has(c.req.method)) {
    await c.req.json().catch(() => undefined);
  }
  await next();
};

// Every module's Hono sub-app should be created via this factory so they all
// share the same Variables typing (req.user / req.session equivalent),
// error handling (AppError, malformed JSON, generic 500), a 1mb body-size
// cap (each ported module is mounted ahead of Express's body parsers, so
// its old express.json({limit}) no longer applies), and body draining.
export const createHonoApp = (): Hono<AppEnv> => {
  const app = new Hono<AppEnv>();
  app.onError(onError);
  app.use(defaultBodyLimitMiddleware);
  app.use(drainRequestBody);
  return app;
};
