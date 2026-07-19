import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { requireAuth } from "../../commons/middlewares/requireAuth.hono";
import { ListsController } from "./lists.controller";

const app = createHonoApp();

// Public (optional auth)
app.get("/:id", ListsController.getById);

// Protected — list CRUD
app.post("/", requireAuth, ListsController.create);
app.patch("/:id", requireAuth, ListsController.update);
app.delete("/:id", requireAuth, ListsController.remove);

// Protected — likes
app.post("/:id/like", requireAuth, ListsController.like);
app.delete("/:id/like", requireAuth, ListsController.unlike);

// Protected — list items
app.post("/:id/items", requireAuth, ListsController.addItem);
app.delete("/:id/items/:itemId", requireAuth, ListsController.removeItem);
app.patch("/:id/reorder", requireAuth, ListsController.reorder);

export default app;
