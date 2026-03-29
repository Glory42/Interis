import { Router } from "express";
import { UsersController } from "./users.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { asyncHandler } from "../../commons/utils/asyncHandler";

const router = Router();

// ── Protected — /me routes first, before /:username ──────────────────────────
router.get("/me", requireAuth, asyncHandler(UsersController.getMe));
router.get("/me/summary", requireAuth, asyncHandler(UsersController.getMeSummary));
router.put("/me", requireAuth, asyncHandler(UsersController.updateMe));
router.put("/me/theme", requireAuth, asyncHandler(UsersController.updateTheme));
// username update → POST /api/auth/update-user (Better Auth)

// ── Public — profile tabs ─────────────────────────────────────────────────────
router.get("/:username", asyncHandler(UsersController.getProfile));
router.get("/:username/diary", asyncHandler(UsersController.getUserDiary));
router.get("/:username/reviews", asyncHandler(UsersController.getUserReviews));
router.get("/:username/films", asyncHandler(UsersController.getUserFilms));
router.get("/:username/likes", asyncHandler(UsersController.getUserLikes));

export default router;
