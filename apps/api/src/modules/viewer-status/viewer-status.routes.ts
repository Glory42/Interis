import { Router } from "express";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { ViewerStatusController } from "./viewer-status.controller";

const router = Router();

router.get("/", asyncHandler(ViewerStatusController.getStatuses));

export default router;
