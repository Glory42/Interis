import { Router } from "express";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { BooksController } from "./books.controller";

const router = Router();

router.get("/search", asyncHandler(BooksController.search));
router.get("/archive", asyncHandler(BooksController.getArchive));
router.get("/logs", requireAuth, asyncHandler(BooksController.getMyLogs));
router.put("/logs/:id", requireAuth, asyncHandler(BooksController.updateLog));
router.delete("/logs/:id", requireAuth, asyncHandler(BooksController.deleteLog));
router.get("/:volumeId/detail", asyncHandler(BooksController.getDetailByVolumeId));
router.get("/:volumeId/logs", asyncHandler(BooksController.getLogsByVolumeId));
router.get("/:volumeId/interaction", requireAuth, asyncHandler(BooksController.getInteraction));
router.put("/:volumeId/interaction", requireAuth, asyncHandler(BooksController.updateInteraction));
router.post("/:volumeId/log", requireAuth, asyncHandler(BooksController.createLog));
router.get("/:volumeId", asyncHandler(BooksController.getByVolumeId));

export default router;
