import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { PeopleController } from "./people.controller";

const app = createHonoApp();

app.get("/:role/:slug", PeopleController.getByRoleAndSlug);

export default app;
