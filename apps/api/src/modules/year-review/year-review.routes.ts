import { Router } from "express";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { YearReviewController } from "./year-review.controller";

// Mounted at /api/users, ahead of the users router.
const router = Router();

router.get("/:username/year/:year", asyncHandler(YearReviewController.read));

export default router;
