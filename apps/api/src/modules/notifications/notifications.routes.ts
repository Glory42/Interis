import { Router } from "express";
import { NotificationsController } from "./notifications.controller";
import { asyncHandler } from "../../commons/utils/asyncHandler";
import { requireAuth } from "../../commons/middlewares/requireAuth";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(NotificationsController.list));
router.get("/unread-count", asyncHandler(NotificationsController.getUnreadCount));
router.post("/read-all", asyncHandler(NotificationsController.markAllRead));
router.post("/:id/read", asyncHandler(NotificationsController.markRead));
router.delete("/", asyncHandler(NotificationsController.removeAll));
router.delete("/:id", asyncHandler(NotificationsController.remove));

export default router;
