import { Router } from "express";
import { PushController } from "./push.controller";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { requireAuth } from "../../commons/middlewares/requireAuth";

const router = Router();

// Public and DB-free: tells the client whether push is configured, and with which key.
router.get("/public-key", asyncHandler(PushController.getPublicKey));

router.use(requireAuth);

router.post("/subscriptions", asyncHandler(PushController.subscribe));
router.delete("/subscriptions", asyncHandler(PushController.unsubscribe));
router.get("/preferences", asyncHandler(PushController.getPreferences));
router.put("/preferences", asyncHandler(PushController.updatePreferences));

export default router;
