import { Router } from "express";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { MusicController } from "./music.controller";
import { MusicEditionsController } from "./music-editions.controller";
import { TracksController } from "./tracks.controller";

const router = Router();

router.get("/search", asyncHandler(MusicController.search));
router.get("/archive", asyncHandler(MusicController.getArchive));
router.get("/logs", requireAuth, asyncHandler(MusicController.getMyLogs));
router.put("/logs/:id", requireAuth, asyncHandler(MusicController.updateLog));
router.delete("/logs/:id", requireAuth, asyncHandler(MusicController.deleteLog));
router.get(
  "/editions/:editionMbid/tracks",
  asyncHandler(MusicEditionsController.getEditionTracklist),
);
router.get("/tracks/logs", requireAuth, asyncHandler(TracksController.getMyLogs));
router.put("/tracks/logs/:id", requireAuth, asyncHandler(TracksController.updateLog));
router.delete("/tracks/logs/:id", requireAuth, asyncHandler(TracksController.deleteLog));
router.get("/tracks/:mbid/logs", asyncHandler(TracksController.getLogsByMbid));
router.get("/tracks/:mbid/detail", asyncHandler(TracksController.getDetailByMbid));
router.get("/tracks/:mbid/interaction", requireAuth, asyncHandler(TracksController.getInteraction));
router.put("/tracks/:mbid/interaction", requireAuth, asyncHandler(TracksController.updateInteraction));
router.post("/tracks/:mbid/log", requireAuth, asyncHandler(TracksController.createLog));
router.get("/tracks/:mbid", asyncHandler(TracksController.getByMbid));
router.get("/:mbid/detail", asyncHandler(MusicController.getDetailByMbid));
router.get("/:mbid/logs", asyncHandler(MusicController.getLogsByMbid));
router.get("/:mbid/interaction", requireAuth, asyncHandler(MusicController.getInteraction));
router.put("/:mbid/interaction", requireAuth, asyncHandler(MusicController.updateInteraction));
router.post("/:mbid/log", requireAuth, asyncHandler(MusicController.createLog));
router.get("/:mbid/editions", asyncHandler(MusicEditionsController.getEditions));
router.get("/:mbid/tracks", asyncHandler(MusicEditionsController.getAlbumTracks));
router.get("/:mbid", asyncHandler(MusicController.getByMbid));

export default router;
