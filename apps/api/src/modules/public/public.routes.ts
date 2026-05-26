import { Router } from "express";
import { PublicController } from "./public.controller";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import rateLimit from "express-rate-limit";

// Separate rate limit for public API — portfolio widget can hammer this
const publicLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 req/min per IP — enough for a widget
  standardHeaders: true,
  legacyHeaders: false,
});

// Per-username limiter: prevents one IP from scraping a specific user's data
const publicUsernameLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip ?? "unknown";
    // req.path inside this router is relative to mount point: /johndoe/profile
    const username = req.path.split("/")[1] ?? "unknown";
    return `${ip}:${username}`;
  },
});

const router = Router();

router.use(publicLimiter);
router.use(publicUsernameLimiter);

router.get("/:username/profile", asyncHandler(PublicController.getProfile));
router.get("/:username/activity", asyncHandler(PublicController.getActivity));
router.get("/:username/recent", asyncHandler(PublicController.getRecent));
router.get("/:username/reviews", asyncHandler(PublicController.getReviews));
router.get("/:username/lists", asyncHandler(PublicController.getLists));
router.get("/:username/likes", asyncHandler(PublicController.getLikes));
router.get("/:username/watchlist", asyncHandler(PublicController.getWatchlist));
router.get("/:username/diary", asyncHandler(PublicController.getDiary));
router.get("/:username/top4", asyncHandler(PublicController.getTop4));

export default router;
