import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { MoviesController } from "./movies.controller";

const app = createHonoApp();

app.get("/search", MoviesController.search);
app.get("/recent", MoviesController.getRecent);
app.get("/archive", MoviesController.getArchive);
app.get("/trending", MoviesController.getTrending);
app.get("/:tmdbId/detail", MoviesController.getDetailByTmdbId);
app.get("/:tmdbId/logs", MoviesController.getLogsByTmdbId);
app.get("/:tmdbId", MoviesController.getByTmdbId);

export default app;
