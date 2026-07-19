import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { AdminController } from "./admin.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth.hono";
import { requireAdmin } from "../../commons/middlewares/requireAdmin.hono";

const app = createHonoApp();

app.use(requireAuth, requireAdmin);

app.get("/users", AdminController.listUsers);
app.post("/users/:username/reset-password", AdminController.resetUserPassword);

export default app;
