import { Router } from "express";
import { InteractionsController } from "./interactions.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { asyncHandler } from "../../commons/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.get("/:tmdbId", asyncHandler(InteractionsController.get));
router.put("/:tmdbId", asyncHandler(InteractionsController.update));

export default router;
