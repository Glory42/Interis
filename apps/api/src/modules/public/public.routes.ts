import { Router } from "express";
import { PublicController } from "./public.controller";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import rateLimit from "express-rate-limit";
import { env } from "../../infrastructure/config/env";
import { createPublicResponseCache } from "./helpers/public-response-cache.helper";

// Separate rate limit for public API — portfolio widget can hammer this
const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 req/min per IP — enough for a widget
  standardHeaders: true,
  legacyHeaders: false,
});

const router = Router();

router.use(publicLimiter);
// Disabled under test so integration suites see their own writes immediately; the
// cache itself is covered by tests/unit/public/public-response-cache.test.ts.
router.use(
  createPublicResponseCache({
    ttlMs: env.NODE_ENV === "test" ? 0 : 5 * 60 * 1000,
    maxEntries: 500,
  }),
);

router.get("/:username/profile", asyncHandler(PublicController.getProfile));
router.get("/:username/activity", asyncHandler(PublicController.getActivity));
router.get("/:username/recent", asyncHandler(PublicController.getRecent));
router.get("/:username/reviews", asyncHandler(PublicController.getReviews));
router.get("/:username/lists", asyncHandler(PublicController.getLists));
router.get("/:username/likes", asyncHandler(PublicController.getLikes));
router.get("/:username/watchlist", asyncHandler(PublicController.getWatchlist));
router.get("/:username/diary", asyncHandler(PublicController.getDiary));
router.get("/:username/top4", asyncHandler(PublicController.getTop4));
router.get("/:username/movies/watched", asyncHandler(PublicController.getWatchedMovies));
// Must be registered before the :tmdbId route below — Express matches in
// registration order, and :tmdbId would otherwise swallow this literal path.
router.get(
  "/:username/serials/currently-watching",
  asyncHandler(PublicController.getSerialsCurrentlyWatching),
);
router.get("/:username/serials/watched", asyncHandler(PublicController.getSerialsWatched));
router.get("/:username/serials/:tmdbId", asyncHandler(PublicController.getSerialProgress));

export default router;
