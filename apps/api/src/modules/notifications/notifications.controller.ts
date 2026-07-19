import type { Context } from "hono";
import type { AppEnv } from "../../infrastructure/http/hono-context.types";
import { sendValidationError } from "../../commons/http/validation-response.hono";
import { NotificationsService } from "./notifications.service";
import { ListNotificationsQuerySchema, NotificationParamsSchema } from "./dto/notifications.dto";

export class NotificationsController {
  static async list(c: Context<AppEnv>): Promise<Response> {
    const parsed = ListNotificationsQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const page = await NotificationsService.listForUser(
      c.get("user").id,
      parsed.data.limit,
      parsed.data.cursor,
    );
    return c.json(page, 200);
  }

  static async getUnreadCount(c: Context<AppEnv>): Promise<Response> {
    const count = await NotificationsService.getUnreadCount(c.get("user").id);
    return c.json({ count }, 200);
  }

  static async markRead(c: Context<AppEnv>): Promise<Response> {
    const parsed = NotificationParamsSchema.safeParse(c.req.param());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    await NotificationsService.markAsRead(c.get("user").id, parsed.data.id);
    return c.json({ success: true }, 200);
  }

  static async markAllRead(c: Context<AppEnv>): Promise<Response> {
    await NotificationsService.markAllAsRead(c.get("user").id);
    return c.json({ success: true }, 200);
  }
}
