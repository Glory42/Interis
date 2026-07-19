import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { InteractionsController } from "./interactions.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth.hono";

const app = createHonoApp();

app.use(requireAuth);

app.get("/:tmdbId", InteractionsController.get);
app.put("/:tmdbId", InteractionsController.update);

export default app;
