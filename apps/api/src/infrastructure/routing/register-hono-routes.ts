import type { Express } from "express";
import { getRequestListener } from "@hono/node-server";
import type { Hono } from "hono";
import type { AppEnv } from "../http/hono-context.types";
import healthApp from "../http/health.hono";
import moviesApp from "../../modules/movies/movies.routes";
import serialsApp from "../../modules/serials/serials.routes";
import peopleApp from "../../modules/people/people.routes";
import searchApp from "../../modules/search/search.routes";
import usersApp from "../../modules/users/users.routes";
import diaryApp from "../../modules/diary/diary.routes";
import reviewsApp from "../../modules/reviews/reviews.routes";
import interactionsApp from "../../modules/interactions/interactions.routes";
import postsApp from "../../modules/posts/posts.routes";
import socialApp from "../../modules/social/social.routes";
import listsApp from "../../modules/lists/lists.routes";
import moderationApp from "../../modules/moderation/moderation.routes";
import notificationsApp from "../../modules/notifications/notifications.routes";
import reportsApp from "../../modules/reports/reports.routes";
import uploadsApp from "../../modules/uploads/uploads.routes";
import dataTransferApp from "../../modules/data-transfer/data-transfer.routes";
import publicApp from "../../modules/public/public.routes";

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
  mount(app, "/api/movies", moviesApp);
  mount(app, "/api/serials", serialsApp);
  mount(app, "/api/people", peopleApp);
  mount(app, "/api/search", searchApp);
  mount(app, "/api/users", usersApp);
  mount(app, "/api/diary", diaryApp);
  mount(app, "/api/reviews", reviewsApp);
  mount(app, "/api/interactions", interactionsApp);
  mount(app, "/api/posts", postsApp);
  mount(app, "/api/social", socialApp);
  mount(app, "/api/lists", listsApp);
  mount(app, "/api/moderation", moderationApp);
  mount(app, "/api/notifications", notificationsApp);
  mount(app, "/api/reports", reportsApp);
  mount(app, "/api/uploads", uploadsApp);
  mount(app, "/api/data", dataTransferApp);
  mount(app, "/api/public", publicApp);
};
