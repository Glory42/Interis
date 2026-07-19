import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { PostsController } from "./posts.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth.hono";

const app = createHonoApp();

// Public
app.get("/:id", PostsController.getById);
app.get("/:id/comments", PostsController.getComments);

// Protected — post CRUD
app.post("/", requireAuth, PostsController.create);
app.put("/:id", requireAuth, PostsController.update);
app.delete("/:id", requireAuth, PostsController.remove);

// Protected — likes
app.post("/:id/like", requireAuth, PostsController.like);
app.delete("/:id/like", requireAuth, PostsController.unlike);

// Protected — comments
// /comments/:commentId must be before /:id/comments to avoid route conflict
app.delete("/comments/:commentId", requireAuth, PostsController.deleteComment);
app.post("/:id/comments", requireAuth, PostsController.addComment);

export default app;
