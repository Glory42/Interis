import type { Request, Response } from "express";
import { sendValidationError } from "../../commons/http/validation-response.helper";
import { NotificationsService } from "./notifications.service";
import {
  ListNotificationsQuerySchema,
  NotificationParamsSchema,
  type ListNotificationsQuery,
  type NotificationParams,
} from "./dto/notifications.dto";

export class NotificationsController {
  static async list(
    req: Request<{}, {}, {}, ListNotificationsQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = ListNotificationsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const page = await NotificationsService.listForUser(
      req.user.id,
      parsed.data.limit,
      parsed.data.cursor,
    );
    res.status(200).json(page);
  }

  static async getUnreadCount(req: Request, res: Response): Promise<void> {
    const count = await NotificationsService.getUnreadCount(req.user.id);
    res.status(200).json({ count });
  }

  static async markRead(req: Request<NotificationParams>, res: Response): Promise<void> {
    const parsed = NotificationParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    await NotificationsService.markAsRead(req.user.id, parsed.data.id);
    res.status(200).json({ success: true });
  }

  static async markAllRead(req: Request, res: Response): Promise<void> {
    await NotificationsService.markAllAsRead(req.user.id);
    res.status(200).json({ success: true });
  }
}
