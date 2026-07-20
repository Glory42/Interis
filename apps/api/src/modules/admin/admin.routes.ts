import { Router } from "express";
import { AdminController } from "./admin.controller";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { requireAdmin } from "../../commons/middlewares/requireAdmin";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/users", asyncHandler(AdminController.listUsers));
router.post(
  "/users/:username/reset-password",
  asyncHandler(AdminController.resetUserPassword),
);

export default router;
