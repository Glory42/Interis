import { Router } from "express";
import { UsersController } from "./users.controller";
import { UsersProfileTabsController } from "./users-profile-tabs.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { createProfileTabsCache } from "./helpers/profile-tabs-cache.helper";
import type { ProfileTab } from "./services/profile-tabs.service";

const router = Router();
const profileTabsCache = createProfileTabsCache();

// Path under /:username → Profile tab.
const PROFILE_TAB_PATHS: [string, ProfileTab][] = [
  ["diary", "diary"],
  ["top4", "top4"],
  ["recent", "recent"],
  ["serials/currently-watching", "currently-watching"],
  ["reviews", "reviews"],
  ["likes", "likes"],
  ["watchlist", "watchlist"],
  ["liked-reviews", "liked-reviews"],
  ["liked-lists", "liked-lists"],
  ["lists", "lists"],
];

// ── Protected — /me routes first, before /:username ──────────────────────────
router.get("/me", requireAuth, asyncHandler(UsersController.getMe));
router.get("/me/summary", requireAuth, asyncHandler(UsersController.getMeSummary));
router.put("/me", requireAuth, asyncHandler(UsersController.updateMe));
router.put("/me/theme", requireAuth, asyncHandler(UsersController.updateTheme));
// username update → POST /api/auth/update-user (Better Auth)

// ── Public — profile tabs ─────────────────────────────────────────────────────
router.get("/", asyncHandler(UsersController.search));
router.get("/stats/network", asyncHandler(UsersController.getNetworkStats));
router.get("/:username", asyncHandler(UsersController.getProfile));
router.get("/:username/stats/detailed", asyncHandler(UsersController.getDetailedStats));
router.get(
  "/:username/reviews/:reviewId",
  asyncHandler(UsersController.getUserReviewDetail),
);
for (const [path, tab] of PROFILE_TAB_PATHS) {
  router.get(`/:username/${path}`, profileTabsCache, asyncHandler(UsersProfileTabsController.tab(tab)));
}
router.get(
  "/:username/recent/grouped",
  profileTabsCache,
  asyncHandler(UsersProfileTabsController.getRecentGrouped),
);

export default router;
