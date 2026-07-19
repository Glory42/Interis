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
import adminApp from "../../modules/admin/admin.routes";
import authApp from "../../modules/auth/auth.routes";

// Every module (issue #30) is its own Hono sub-app, composed into the
// top-level app's router via .route() — each keeps its own body-limit,
// body-draining, and error-handling middleware chain intact.
export const registerHonoRoutes = (app: Hono<AppEnv>): void => {
  app.route("/api/health", healthApp);
  app.route("/api/movies", moviesApp);
  app.route("/api/serials", serialsApp);
  app.route("/api/people", peopleApp);
  app.route("/api/search", searchApp);
  app.route("/api/users", usersApp);
  app.route("/api/diary", diaryApp);
  app.route("/api/reviews", reviewsApp);
  app.route("/api/interactions", interactionsApp);
  app.route("/api/posts", postsApp);
  app.route("/api/social", socialApp);
  app.route("/api/lists", listsApp);
  app.route("/api/moderation", moderationApp);
  app.route("/api/notifications", notificationsApp);
  app.route("/api/reports", reportsApp);
  app.route("/api/uploads", uploadsApp);
  app.route("/api/data", dataTransferApp);
  app.route("/api/public", publicApp);
  app.route("/api/admin", adminApp);
  app.route("/api/auth", authApp);
};
