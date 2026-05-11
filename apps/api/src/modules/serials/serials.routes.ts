import { Router } from "express";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { SerialsController } from "./serials.controller";

const router = Router();

router.get("/search", asyncHandler(SerialsController.search));
router.get("/recent", asyncHandler(SerialsController.getRecent));
router.get("/archive", asyncHandler(SerialsController.getArchive));
router.get("/trending", asyncHandler(SerialsController.getTrending));
router.get("/logs", requireAuth, asyncHandler(SerialsController.getMyLogs));
router.put("/logs/:id", requireAuth, asyncHandler(SerialsController.updateLog));
router.delete("/logs/:id", requireAuth, asyncHandler(SerialsController.deleteLog));
router.get("/:tmdbId/detail", asyncHandler(SerialsController.getDetailByTmdbId));
router.get("/:tmdbId/logs", asyncHandler(SerialsController.getLogsByTmdbId));
router.get(
  "/:tmdbId/seasons/:seasonNumber",
  asyncHandler(SerialsController.getSeasonByTmdbId),
);
router.get(
  "/:tmdbId/interaction",
  requireAuth,
  asyncHandler(SerialsController.getInteractionByTmdbId),
);
router.put(
  "/:tmdbId/interaction",
  requireAuth,
  asyncHandler(SerialsController.updateInteractionByTmdbId),
);
router.post("/:tmdbId/log", requireAuth, asyncHandler(SerialsController.createLogByTmdbId));
router.get("/:tmdbId", asyncHandler(SerialsController.getByTmdbId));

export default router;
