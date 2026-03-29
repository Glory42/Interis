import { Router } from "express";
import { ReviewsController } from "./reviews.controller";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { asyncHandler } from "../../commons/utils/asyncHandler";

const router = Router();

// Public
router.get("/:id", asyncHandler(ReviewsController.getById));
router.get("/:id/comments", asyncHandler(ReviewsController.getComments));

// Protected — review CRUD
router.post("/", requireAuth, asyncHandler(ReviewsController.create));
router.put("/:id", requireAuth, asyncHandler(ReviewsController.update));
router.delete("/:id", requireAuth, asyncHandler(ReviewsController.remove));

// Protected — comment CRUD
router.post(
  "/:id/comments",
  requireAuth,
  asyncHandler(ReviewsController.addComment),
);
router.delete(
  "/comments/:commentId",
  requireAuth,
  asyncHandler(ReviewsController.deleteComment),
);

// Protected — likes
router.post(
  "/:id/like",
  requireAuth,
  asyncHandler(ReviewsController.likeReview),
);
router.delete(
  "/:id/like",
  requireAuth,
  asyncHandler(ReviewsController.unlikeReview),
);
router.post(
  "/comments/:commentId/like",
  requireAuth,
  asyncHandler(ReviewsController.likeComment),
);
router.delete(
  "/comments/:commentId/like",
  requireAuth,
  asyncHandler(ReviewsController.unlikeComment),
);

export default router;
