import { Router } from "express";
import { ReportsController } from "./reports.controller";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { requireAdmin } from "../../commons/middlewares/requireAdmin";

const router = Router();

router.use(requireAuth);

router.post("/", asyncHandler(ReportsController.submit));
router.get("/", requireAdmin, asyncHandler(ReportsController.list));
router.post("/:id/resolve", requireAdmin, asyncHandler(ReportsController.resolve));
router.post("/:id/dismiss", requireAdmin, asyncHandler(ReportsController.dismiss));
router.post(
  "/:id/remove-content",
  requireAdmin,
  asyncHandler(ReportsController.removeContent),
);

export default router;
