import { Router } from "express";
import { AdminController } from "./admin.controller";
import { AdminContentController } from "./admin-content.controller";
import { AdminMediaController } from "./admin-media.controller";
import { AdminCommunityController } from "./admin-community.controller";
import { AdminAuditController } from "./admin-audit.controller";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { requireAdmin } from "../../commons/middlewares/requireAdmin";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/audit", asyncHandler(AdminAuditController.list));
router.get("/users", asyncHandler(AdminController.listUsers));
router.get("/users/:username", asyncHandler(AdminController.getUserDetail));
router.post("/users/:username/revoke-sessions", asyncHandler(AdminController.revokeUserSessions));
router.post("/users/:username/force-password-reset", asyncHandler(AdminController.forcePasswordReset));
// Fallback for accounts with no recovery question, which force reset can't help.
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

router.get("/movies", asyncHandler(AdminMediaController.listMovies));
router.patch("/movies/:id", asyncHandler(AdminMediaController.updateMovie));
router.post("/movies/:id/refresh", asyncHandler(AdminMediaController.refreshMovie));
router.delete("/movies/:id", asyncHandler(AdminMediaController.deleteMovie));
router.get("/serials", asyncHandler(AdminMediaController.listSerials));
router.patch("/serials/:id", asyncHandler(AdminMediaController.updateSerial));
router.post("/serials/:id/refresh", asyncHandler(AdminMediaController.refreshSerial));
router.delete("/serials/:id", asyncHandler(AdminMediaController.deleteSerial));

router.get("/lists", asyncHandler(AdminCommunityController.listLists));
router.delete("/lists/:id", asyncHandler(AdminCommunityController.deleteList));
router.get("/activities", asyncHandler(AdminCommunityController.listActivities));
router.delete("/activities/:id", asyncHandler(AdminCommunityController.deleteActivity));

export default router;
