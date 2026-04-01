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

const router = Router();

router.use(publicLimiter);

router.get("/:username/recent", asyncHandler(PublicController.getRecent));
router.get("/:username/top4", asyncHandler(PublicController.getTop4));
router.get(
  "/:username/contributions",
  asyncHandler(PublicController.getContributions),
);
router.get("/:username/stats", asyncHandler(PublicController.getStats));

export default router;
