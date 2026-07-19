import type { Context } from "hono";
import { sendValidationError } from "../../commons/http/validation-response.hono";
import { AdminService } from "./admin.service";
import { AdminResetPasswordSchema, ListUsersQuerySchema } from "./dto/admin.dto";

export class AdminController {
  static async listUsers(c: Context): Promise<Response> {
    const parsed = ListUsersQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const users = await AdminService.listUsers(
      parsed.data.query,
      parsed.data.limit ?? 20,
      parsed.data.offset ?? 0,
    );
    return c.json(users, 200);
  }

  // POST /api/admin/users/:username/reset-password
  static async resetUserPassword(c: Context): Promise<Response> {
    const parsed = AdminResetPasswordSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    await AdminService.resetUserPassword(c.req.param("username") as string, parsed.data.newPassword);
    return c.json({ success: true }, 200);
  }
}
