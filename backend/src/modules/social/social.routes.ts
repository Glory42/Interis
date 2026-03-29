import { Router } from "express";
import { SocialController } from "./social.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { asyncHandler } from "../../commons/utils/asyncHandler";

const router = Router();

// Protected
router.get(
  "/feed/following",
  requireAuth,
  asyncHandler(SocialController.getFollowingFeed),
);
router.get("/feed", requireAuth, asyncHandler(SocialController.getFeed));
router.post(
  "/follow/:username",
  requireAuth,
  asyncHandler(SocialController.follow),
);
router.delete(
  "/follow/:username",
  requireAuth,
  asyncHandler(SocialController.unfollow),
);

// Protected
router.get(
  "/is-following/:username",
  requireAuth,
  asyncHandler(SocialController.checkIsFollowing),
);

// Public
router.get("/followers/:username", asyncHandler(SocialController.getFollowers));
router.get("/following/:username", asyncHandler(SocialController.getFollowing));

export default router;
