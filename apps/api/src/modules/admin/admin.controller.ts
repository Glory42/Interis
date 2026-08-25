import type { Request, Response } from "express";
import { sendBadRequest, sendValidationError } from "../../commons/http/validation-response.helper";
import { AdminService } from "./admin.service";
import {
  AdminResetPasswordSchema,
  AdminSuspendUserSchema,
  ListUsersQuerySchema,
  type ListUsersQuery,
} from "./dto/admin.dto";

// Prevents an admin from suspending/demoting/deleting their own account
// through this panel and locking themselves out.
const isSelfTarget = (req: Request<{ username: string }>): boolean =>
  req.user.username === req.params.username;

export class AdminController {
  static async listUsers(
    req: Request<{}, {}, {}, ListUsersQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = ListUsersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const users = await AdminService.listUsers(
      parsed.data.query,
      parsed.data.limit ?? 20,
      parsed.data.offset ?? 0,
    );
    res.status(200).json(users);
  }

  // POST /api/admin/users/:username/reset-password
  static async resetUserPassword(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    const parsed = AdminResetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    await AdminService.resetUserPassword(req.params.username, parsed.data.newPassword);
    res.status(200).json({ success: true });
  }

  // POST /api/admin/users/:username/suspend
  static async suspendUser(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    if (isSelfTarget(req)) {
      sendBadRequest(res, "You cannot suspend your own account");
      return;
    }

    const parsed = AdminSuspendUserSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    await AdminService.suspendUser(req.params.username, parsed.data.reason);
    res.status(200).json({ success: true });
  }

  // POST /api/admin/users/:username/unsuspend
  static async unsuspendUser(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    await AdminService.unsuspendUser(req.params.username);
    res.status(200).json({ success: true });
  }

  // POST /api/admin/users/:username/promote
  static async promoteUser(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    await AdminService.promoteUser(req.params.username);
    res.status(200).json({ success: true });
  }

  // POST /api/admin/users/:username/demote
  static async demoteUser(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    if (isSelfTarget(req)) {
      sendBadRequest(res, "You cannot demote your own account");
      return;
    }

    await AdminService.demoteUser(req.params.username);
    res.status(200).json({ success: true });
  }

  // DELETE /api/admin/users/:username
  static async deleteUser(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    if (isSelfTarget(req)) {
      sendBadRequest(res, "You cannot delete your own account");
      return;
    }

    await AdminService.deleteUser(req.params.username);
    res.status(200).json({ success: true });
  }
}
