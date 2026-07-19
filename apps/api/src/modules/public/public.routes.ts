import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { PublicController } from "./public.controller";
import { publicCorsMiddleware } from "../../commons/middlewares/cors.hono";
import { createPublicLimiter } from "../../commons/middlewares/rateLimiters.hono";

const app = createHonoApp();

app.use(publicCorsMiddleware);
app.use(createPublicLimiter());

app.get("/:username/profile", PublicController.getProfile);
app.get("/:username/activity", PublicController.getActivity);
app.get("/:username/recent", PublicController.getRecent);
app.get("/:username/reviews", PublicController.getReviews);
app.get("/:username/lists", PublicController.getLists);
app.get("/:username/likes", PublicController.getLikes);
app.get("/:username/watchlist", PublicController.getWatchlist);
app.get("/:username/diary", PublicController.getDiary);
app.get("/:username/top4", PublicController.getTop4);
app.get("/:username/movies/watched", PublicController.getWatchedFilms);
// Must be registered before the :tmdbId route below to avoid :tmdbId
// swallowing this literal path.
app.get("/:username/serials/currently-watching", PublicController.getSerialsCurrentlyWatching);
app.get("/:username/serials/watched", PublicController.getSerialsWatched);
app.get("/:username/serials/:tmdbId", PublicController.getSerialProgress);

export default app;
