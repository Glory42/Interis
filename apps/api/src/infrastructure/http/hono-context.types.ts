import { Hono } from "hono";
import type { AuthUser, RequestSession } from "../../modules/auth/types/auth.types";
import { onError } from "../../commons/errors/onError.hono";

export type AppVariables = {
  user: AuthUser;
  session: RequestSession;
};

export type AppEnv = {
  Variables: AppVariables;
};

// Every module's Hono sub-app should be created via this factory so they all
// share the same Variables typing (req.user / req.session equivalent) and
// error handling (AppError, malformed JSON, generic 500).
export const createHonoApp = (): Hono<AppEnv> => {
  const app = new Hono<AppEnv>();
  app.onError(onError);
  return app;
};
