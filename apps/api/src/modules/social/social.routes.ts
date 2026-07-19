import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { SocialController } from "./social.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth.hono";

const app = createHonoApp();

// Protected
app.get("/feed/following", requireAuth, SocialController.getFollowingFeed);
app.get("/feed", requireAuth, SocialController.getFeed);
app.post("/follow/:username", requireAuth, SocialController.follow);
app.delete("/follow/:username", requireAuth, SocialController.unfollow);
app.delete("/follower/:username", requireAuth, SocialController.removeFollower);
app.get("/is-following/:username", requireAuth, SocialController.checkIsFollowing);

// Activity likes
app.post("/activities/:activityId/like", requireAuth, SocialController.likeActivity);
app.delete("/activities/:activityId/like", requireAuth, SocialController.unlikeActivity);

// Public
app.get("/followers/:username", SocialController.getFollowers);
app.get("/following/:username", SocialController.getFollowing);

export default app;
