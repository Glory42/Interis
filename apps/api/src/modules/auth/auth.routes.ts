import { Router } from "express";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { AuthController } from "./auth.controller";

const router = Router();

router.post("/sign-up/email", asyncHandler(AuthController.signUp));
router.post("/sign-in/email", asyncHandler(AuthController.signIn));
router.post("/sign-out", asyncHandler(AuthController.signOut));
router.post("/forgot-password", asyncHandler(AuthController.forgotPassword));
router.post("/reset-password", asyncHandler(AuthController.resetPassword));

router.post("/update-user", requireAuth, asyncHandler(AuthController.updateUser));
router.delete("/account", requireAuth, asyncHandler(AuthController.deleteAccount));
router.post("/change-password", requireAuth, asyncHandler(AuthController.changePassword));
router.post("/change-email", requireAuth, asyncHandler(AuthController.changeEmail));
router.post(
  "/security-question",
  requireAuth,
  asyncHandler(AuthController.setSecurityQuestion),
);

export default router;
