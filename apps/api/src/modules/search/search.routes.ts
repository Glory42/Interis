import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { SearchController } from "./search.controller";

const app = createHonoApp();

app.get("/", SearchController.searchTitles);

export default app;
