import { Router } from "express";
import { UploadsController } from "./uploads.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { asyncHandler } from "../../commons/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.post("/request", asyncHandler(UploadsController.requestUpload));
router.post("/confirm", asyncHandler(UploadsController.confirmUpload));

export default router;
