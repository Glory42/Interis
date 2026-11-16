import { Router } from "express";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { WatchGoalsController } from "./watch-goals.controller";

// Mounted at /api/users/me/goal, ahead of the users router.
const router = Router();

router.use(requireAuth);
router.put("/:year", asyncHandler(WatchGoalsController.set));
router.delete("/:year", asyncHandler(WatchGoalsController.clear));

export default router;
