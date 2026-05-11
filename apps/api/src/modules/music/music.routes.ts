import { Router } from "express";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { MusicController } from "./music.controller";

const router = Router();

router.get("/search", asyncHandler(MusicController.search));
router.get("/archive", asyncHandler(MusicController.getArchive));
router.get("/logs", requireAuth, asyncHandler(MusicController.getMyLogs));
router.put("/logs/:id", requireAuth, asyncHandler(MusicController.updateLog));
router.delete("/logs/:id", requireAuth, asyncHandler(MusicController.deleteLog));
router.get("/:mbid/detail", asyncHandler(MusicController.getDetailByMbid));
router.get("/:mbid/logs", asyncHandler(MusicController.getLogsByMbid));
router.get("/:mbid/interaction", requireAuth, asyncHandler(MusicController.getInteraction));
router.put("/:mbid/interaction", requireAuth, asyncHandler(MusicController.updateInteraction));
router.post("/:mbid/log", requireAuth, asyncHandler(MusicController.createLog));
router.get("/:mbid", asyncHandler(MusicController.getByMbid));

export default router;
