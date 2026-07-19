import type { Express } from "express";
import { getRequestListener } from "@hono/node-server";
import type { Hono } from "hono";
import type { AppEnv } from "../http/hono-context.types";
import healthApp from "../http/health.hono";

const mount = (app: Express, prefix: string, honoApp: Hono<AppEnv>): void => {
  app.use(prefix, getRequestListener(honoApp.fetch));
};

// Modules ported to Hono (issue #30) are mounted here, ahead of Express's
// body parsers in index.ts — each is a terminal handler that reads its own
// request body straight from the raw stream, so it must never sit behind
// express.json()/urlencoded() having already consumed it. As each module
// moves off Express, its old app.use(prefix, router) line in
// register-routes.ts is deleted and the Hono equivalent added here.
export const registerHonoRoutes = (app: Express): void => {
  mount(app, "/api/health", healthApp);
};
