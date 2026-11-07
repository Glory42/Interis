import { Router } from "express";
import { FilmsController } from "./films.controller";
import { asyncHandler } from "../../commons/utils/asyncHandler";

const router = Router();

router.get("/search", asyncHandler(FilmsController.search));
router.get("/recent", asyncHandler(FilmsController.getRecent));
router.get("/archive", asyncHandler(FilmsController.getArchive));
router.get("/trending", asyncHandler(FilmsController.getTrending));
router.get("/:tmdbId/detail", asyncHandler(FilmsController.getDetailByTmdbId));
router.get("/:tmdbId/reviews", asyncHandler(FilmsController.getReviews));
router.get("/:tmdbId/logs", asyncHandler(FilmsController.getLogsByTmdbId));
router.get("/:tmdbId", asyncHandler(FilmsController.getByTmdbId));

export default router;
