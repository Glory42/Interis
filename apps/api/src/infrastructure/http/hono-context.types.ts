import { Hono } from "hono";
import type { AuthUser, RequestSession } from "../../modules/auth/types/auth.types";

export type AppVariables = {
  user: AuthUser;
  session: RequestSession;
};

export type AppEnv = {
  Variables: AppVariables;
};

// Every module's Hono sub-app should be created via this factory so they all
// share the same Variables typing (req.user / req.session equivalent).
export const createHonoApp = (): Hono<AppEnv> => new Hono<AppEnv>();
