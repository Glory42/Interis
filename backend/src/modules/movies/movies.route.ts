import { Router } from "express";
import { MoviesController } from "./movies.controller";
import { asyncHandler } from "../../commons/utils/asyncHandler";

const router = Router();

router.get("/search", asyncHandler(MoviesController.search));
router.get("/recent", asyncHandler(MoviesController.getRecent));
router.get("/:tmdbId/logs", asyncHandler(MoviesController.getLogsByTmdbId));
router.get("/:tmdbId", asyncHandler(MoviesController.getByTmdbId));

export default router;
