import { Router } from "express";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { TvController } from "./tv.controller";
import { TvTrackingController } from "./tv-tracking.controller";

const router = Router();

router.get("/search", asyncHandler(TvController.search));
router.get("/recent", asyncHandler(TvController.getRecent));
router.get("/archive", asyncHandler(TvController.getArchive));
router.get("/trending", asyncHandler(TvController.getTrending));
router.get("/logs", requireAuth, asyncHandler(TvController.getMyLogs));
router.put("/logs/:id", requireAuth, asyncHandler(TvController.updateLog));
router.delete("/logs/:id", requireAuth, asyncHandler(TvController.deleteLog));
router.get("/:tmdbId/detail", asyncHandler(TvController.getDetailByTmdbId));
router.get("/:tmdbId/reviews", asyncHandler(TvController.getReviews));
router.get("/:tmdbId/logs", asyncHandler(TvController.getLogsByTmdbId));
router.get(
  "/:tmdbId/seasons/:seasonNumber",
  asyncHandler(TvController.getSeasonByTmdbId),
);
router.post(
  "/:tmdbId/seasons/:seasonNumber/watched-through/:episodeNumber",
  requireAuth,
  asyncHandler(TvTrackingController.markWatchedThrough),
);
router.put(
  "/:tmdbId/seasons/:seasonNumber/interaction",
  requireAuth,
  asyncHandler(TvTrackingController.updateSeasonInteraction),
);
router.put(
  "/:tmdbId/seasons/:seasonNumber/episodes/:episodeNumber/interaction",
  requireAuth,
  asyncHandler(TvTrackingController.updateEpisodeInteraction),
);
router.get(
  "/:tmdbId/seasons/:seasonNumber/review",
  requireAuth,
  asyncHandler(TvTrackingController.getSeasonReview),
);
router.post(
  "/:tmdbId/seasons/:seasonNumber/review",
  requireAuth,
  asyncHandler(TvTrackingController.upsertSeasonReview),
);
router.delete(
  "/:tmdbId/seasons/:seasonNumber/review",
  requireAuth,
  asyncHandler(TvTrackingController.deleteSeasonReview),
);
router.get(
  "/:tmdbId/seasons/:seasonNumber/episodes/:episodeNumber/review",
  requireAuth,
  asyncHandler(TvTrackingController.getEpisodeReview),
);
router.post(
  "/:tmdbId/seasons/:seasonNumber/episodes/:episodeNumber/review",
  requireAuth,
  asyncHandler(TvTrackingController.upsertEpisodeReview),
);
router.delete(
  "/:tmdbId/seasons/:seasonNumber/episodes/:episodeNumber/review",
  requireAuth,
  asyncHandler(TvTrackingController.deleteEpisodeReview),
);
router.get(
  "/:tmdbId/interaction",
  requireAuth,
  asyncHandler(TvController.getInteractionByTmdbId),
);
router.put(
  "/:tmdbId/interaction",
  requireAuth,
  asyncHandler(TvController.updateInteractionByTmdbId),
);
router.post("/:tmdbId/log", requireAuth, asyncHandler(TvController.createLogByTmdbId));
router.get("/:tmdbId", asyncHandler(TvController.getByTmdbId));

export default router;
