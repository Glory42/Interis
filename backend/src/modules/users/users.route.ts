import { Router } from "express";
import { UsersController } from "./users.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { asyncHandler } from "../../commons/utils/asyncHandler";

const router = Router();

router.get("/me", requireAuth, asyncHandler(UsersController.getMe));
router.put("/me", requireAuth, asyncHandler(UsersController.updateMe));
router.put(
  "/me/username",
  requireAuth,
  asyncHandler(UsersController.updateUsername),
);

// Public routes
router.get("/:username", asyncHandler(UsersController.getProfile));
router.get("/:username/diary", asyncHandler(UsersController.getUserDiary));

export default router;
