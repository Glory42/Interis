import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { UsersController } from "./users.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth.hono";

const app = createHonoApp();

// ── Protected — /me routes first, before /:username ──────────────────────────
app.get("/me", requireAuth, UsersController.getMe);
app.get("/me/summary", requireAuth, UsersController.getMeSummary);
app.put("/me", requireAuth, UsersController.updateMe);
app.put("/me/theme", requireAuth, UsersController.updateTheme);
// username update → POST /api/auth/update-user (auth module)

// ── Public — profile tabs ─────────────────────────────────────────────────────
app.get("/", UsersController.search);
app.get("/stats/network", UsersController.getNetworkStats);
app.get("/:username", UsersController.getProfile);
app.get("/:username/stats/detailed", UsersController.getDetailedStats);
app.get("/:username/reviews", UsersController.getUserReviews);
app.get("/:username/reviews/:reviewId", UsersController.getUserReviewDetail);
app.get("/:username/likes", UsersController.getUserLikes);
app.get("/:username/liked-reviews", UsersController.getUserLikedReviews);
app.get("/:username/liked-lists", UsersController.getUserLikedLists);
app.get("/:username/watchlist", UsersController.getUserWatchlist);
app.get("/:username/lists", UsersController.getUserLists);

export default app;
