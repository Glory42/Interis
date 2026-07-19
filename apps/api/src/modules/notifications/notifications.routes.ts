import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { NotificationsController } from "./notifications.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth.hono";

const app = createHonoApp();

app.use(requireAuth);

app.get("/", NotificationsController.list);
app.get("/unread-count", NotificationsController.getUnreadCount);
app.post("/read-all", NotificationsController.markAllRead);
app.post("/:id/read", NotificationsController.markRead);

export default app;
