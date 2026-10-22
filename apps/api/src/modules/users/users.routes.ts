import { Router } from "express";
import { UsersController } from "./users.controller";
import { UsersProfileTabsController } from "./users-profile-tabs.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { peekViewerUserIdFromHeaders } from "../../commons/auth/session-resolver.helper";
import { env } from "../../infrastructure/config/env";
import { createPublicResponseCache } from "../public/helpers/public-response-cache.helper";

const router = Router();

// Same 5-minute cache as the widget API, except the profile owner always
// bypasses it. Disabled under test so integration suites see their own writes.
const profileTabsCache = createPublicResponseCache({
  ttlMs: env.NODE_ENV === "test" ? 0 : 5 * 60 * 1000,
  maxEntries: 500,
  resolveViewerId: (req) => peekViewerUserIdFromHeaders(req.headers),
});

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
router.get("/:username/reviews", asyncHandler(UsersController.getUserReviews));
router.get(
  "/:username/reviews/:reviewId",
  asyncHandler(UsersController.getUserReviewDetail),
);
router.get("/:username/likes", asyncHandler(UsersController.getUserLikes));
router.get("/:username/liked-reviews", asyncHandler(UsersController.getUserLikedReviews));
router.get("/:username/liked-lists", asyncHandler(UsersController.getUserLikedLists));
router.get("/:username/watchlist", asyncHandler(UsersController.getUserWatchlist));
router.get("/:username/lists", asyncHandler(UsersController.getUserLists));
router.get(
  "/:username/diary",
  profileTabsCache,
  asyncHandler(UsersProfileTabsController.getDiary),
);
router.get("/:username/top4", profileTabsCache, asyncHandler(UsersProfileTabsController.getTop4));
router.get(
  "/:username/recent",
  profileTabsCache,
  asyncHandler(UsersProfileTabsController.getRecent),
);
router.get(
  "/:username/serials/currently-watching",
  profileTabsCache,
  asyncHandler(UsersProfileTabsController.getSerialsCurrentlyWatching),
);

export default router;
