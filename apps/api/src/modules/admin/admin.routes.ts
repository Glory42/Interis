import { Router } from "express";
import { AdminController } from "./admin.controller";
import { AdminContentController } from "./admin-content.controller";
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
router.post("/users/:username/suspend", asyncHandler(AdminController.suspendUser));
router.post("/users/:username/unsuspend", asyncHandler(AdminController.unsuspendUser));
router.post("/users/:username/promote", asyncHandler(AdminController.promoteUser));
router.post("/users/:username/demote", asyncHandler(AdminController.demoteUser));
router.delete("/users/:username", asyncHandler(AdminController.deleteUser));

router.get("/reviews", asyncHandler(AdminContentController.listReviews));
router.delete("/reviews/:id", asyncHandler(AdminContentController.deleteReview));
router.get("/diary", asyncHandler(AdminContentController.listDiaryEntries));
router.delete("/diary/:id", asyncHandler(AdminContentController.deleteDiaryEntry));
router.get("/posts", asyncHandler(AdminContentController.listPosts));
router.delete("/posts/:id", asyncHandler(AdminContentController.deletePost));

export default router;
