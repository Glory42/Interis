import { Router } from "express";
import { ModerationController } from "./moderation.controller";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { requireAuth } from "../../commons/middlewares/requireAuth";

const router = Router();

router.use(requireAuth);

router.get("/blocked", asyncHandler(ModerationController.getBlocked));
router.get("/muted", asyncHandler(ModerationController.getMuted));
router.get("/state/:username", asyncHandler(ModerationController.getRelationshipState));
router.post("/block/:username", asyncHandler(ModerationController.block));
router.delete("/block/:username", asyncHandler(ModerationController.unblock));
router.post("/mute/:username", asyncHandler(ModerationController.mute));
router.delete("/mute/:username", asyncHandler(ModerationController.unmute));

export default router;
