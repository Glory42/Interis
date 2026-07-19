import { createHonoApp } from "../../infrastructure/http/hono-context.types";
import { ReviewsController } from "./reviews.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth.hono";

const app = createHonoApp();

// Public
app.get("/:id", ReviewsController.getById);
app.get("/:id/comments", ReviewsController.getComments);

// Protected — review CRUD
app.post("/", requireAuth, ReviewsController.create);
app.put("/:id", requireAuth, ReviewsController.update);
app.delete("/:id", requireAuth, ReviewsController.remove);

// Protected — comment CRUD
app.post("/:id/comments", requireAuth, ReviewsController.addComment);
app.delete("/comments/:commentId", requireAuth, ReviewsController.deleteComment);

// Protected — likes
app.post("/:id/like", requireAuth, ReviewsController.likeReview);
app.delete("/:id/like", requireAuth, ReviewsController.unlikeReview);

export default app;
