import { Router } from "express";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { requireAuth } from "../../commons/middlewares/requireAuth";
import { ListsController } from "./lists.controller";

const router = Router();

// Public (optional auth)
router.get("/:id", asyncHandler(ListsController.getById));

// Protected — list CRUD
router.post("/", requireAuth, asyncHandler(ListsController.create));
router.patch("/:id", requireAuth, asyncHandler(ListsController.update));
router.delete("/:id", requireAuth, asyncHandler(ListsController.remove));

// Protected — likes
router.post("/:id/like", requireAuth, asyncHandler(ListsController.like));
router.delete("/:id/like", requireAuth, asyncHandler(ListsController.unlike));

// Protected — list items
router.post("/:id/items", requireAuth, asyncHandler(ListsController.addItem));
router.delete(
  "/:id/items/:itemId",
  requireAuth,
  asyncHandler(ListsController.removeItem),
);
router.patch(
  "/:id/items/:itemId",
  requireAuth,
  asyncHandler(ListsController.updateItemNote),
);
router.patch("/:id/reorder", requireAuth, asyncHandler(ListsController.reorder));

// Protected — List Collaborators
router.post("/:id/collaborators", requireAuth, asyncHandler(ListsController.inviteCollaborator));
router.post("/:id/collaborators/accept", requireAuth, asyncHandler(ListsController.acceptInvite));
router.delete(
  "/:id/collaborators/:userId",
  requireAuth,
  asyncHandler(ListsController.removeCollaborator),
);

export default router;
