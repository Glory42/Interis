import { Router } from "express";
import { PostsController } from "./posts.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { asyncHandler } from "../../commons/utils/asyncHandler";

const router = Router();

// Public
router.get("/:id", asyncHandler(PostsController.getById));
router.get("/:id/comments", asyncHandler(PostsController.getComments));

// Protected — post CRUD
router.post("/", requireAuth, asyncHandler(PostsController.create));
router.put("/:id", requireAuth, asyncHandler(PostsController.update));
router.delete("/:id", requireAuth, asyncHandler(PostsController.remove));

// Protected — likes
router.post("/:id/like", requireAuth, asyncHandler(PostsController.like));
router.delete("/:id/like", requireAuth, asyncHandler(PostsController.unlike));

// Protected — comments
// /comments/:commentId must be before /:id/comments to avoid route conflict
router.delete(
  "/comments/:commentId",
  requireAuth,
  asyncHandler(PostsController.deleteComment),
);
router.post(
  "/:id/comments",
  requireAuth,
  asyncHandler(PostsController.addComment),
);

export default router;
