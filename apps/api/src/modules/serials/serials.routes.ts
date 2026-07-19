import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { requireAuth } from "../../commons/middlewares/requireAuth.hono";
import { SerialsController } from "./serials.controller";
import { SerialsTrackingController } from "./serials-tracking.controller";

const app = createHonoApp();

app.get("/search", SerialsController.search);
app.get("/recent", SerialsController.getRecent);
app.get("/archive", SerialsController.getArchive);
app.get("/trending", SerialsController.getTrending);
app.get("/logs", requireAuth, SerialsController.getMyLogs);
app.put("/logs/:id", requireAuth, SerialsController.updateLog);
app.delete("/logs/:id", requireAuth, SerialsController.deleteLog);
app.get("/:tmdbId/detail", SerialsController.getDetailByTmdbId);
app.get("/:tmdbId/logs", SerialsController.getLogsByTmdbId);
app.get("/:tmdbId/seasons/:seasonNumber", SerialsController.getSeasonByTmdbId);
app.put(
  "/:tmdbId/seasons/:seasonNumber/interaction",
  requireAuth,
  SerialsTrackingController.updateSeasonInteraction,
);
app.put(
  "/:tmdbId/seasons/:seasonNumber/episodes/:episodeNumber/interaction",
  requireAuth,
  SerialsTrackingController.updateEpisodeInteraction,
);
app.get(
  "/:tmdbId/seasons/:seasonNumber/review",
  requireAuth,
  SerialsTrackingController.getSeasonReview,
);
app.post(
  "/:tmdbId/seasons/:seasonNumber/review",
  requireAuth,
  SerialsTrackingController.upsertSeasonReview,
);
app.delete(
  "/:tmdbId/seasons/:seasonNumber/review",
  requireAuth,
  SerialsTrackingController.deleteSeasonReview,
);
app.get(
  "/:tmdbId/seasons/:seasonNumber/episodes/:episodeNumber/review",
  requireAuth,
  SerialsTrackingController.getEpisodeReview,
);
app.post(
  "/:tmdbId/seasons/:seasonNumber/episodes/:episodeNumber/review",
  requireAuth,
  SerialsTrackingController.upsertEpisodeReview,
);
app.delete(
  "/:tmdbId/seasons/:seasonNumber/episodes/:episodeNumber/review",
  requireAuth,
  SerialsTrackingController.deleteEpisodeReview,
);
app.get("/:tmdbId/interaction", requireAuth, SerialsController.getInteractionByTmdbId);
app.put("/:tmdbId/interaction", requireAuth, SerialsController.updateInteractionByTmdbId);
app.post("/:tmdbId/log", requireAuth, SerialsController.createLogByTmdbId);
app.get("/:tmdbId", SerialsController.getByTmdbId);

export default app;
