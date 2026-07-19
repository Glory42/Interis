import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { ReportsController } from "./reports.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth.hono";
import { requireAdmin } from "../../commons/middlewares/requireAdmin.hono";

const app = createHonoApp();

app.use(requireAuth);

app.post("/", ReportsController.submit);
app.get("/", requireAdmin, ReportsController.list);
app.post("/:id/resolve", requireAdmin, ReportsController.resolve);
app.post("/:id/dismiss", requireAdmin, ReportsController.dismiss);
app.post("/:id/remove-content", requireAdmin, ReportsController.removeContent);

export default app;
