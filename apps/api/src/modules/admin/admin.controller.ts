import type { Request, Response } from "express";
import { sendBadRequest, sendValidationError } from "../../commons/http/validation-response.helper";
import { AdminService } from "./admin.service";
import { AdminAuditService } from "./admin-audit.service";
import {
  AdminPasswordConfirmSchema,
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

  // GET /api/admin/users/:username
  static async getUserDetail(req: Request<{ username: string }>, res: Response): Promise<void> {
    res.status(200).json(await AdminService.getUserDetail(req.params.username));
  }

  // POST /api/admin/users/:username/revoke-sessions
  static async revokeUserSessions(req: Request<{ username: string }>, res: Response): Promise<void> {
    if (isSelfTarget(req)) {
      sendBadRequest(res, "Sign out your own devices from account settings");
      return;
    }

    const parsed = AdminPasswordConfirmSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const targetId = await AdminService.revokeUserSessions(req.user.id, parsed.data.adminPassword, req.params.username);
    await AdminAuditService.record(req.user, {
      action: "user.revoke_sessions",
      targetType: "user",
      targetId,
      targetLabel: req.params.username,
    });
    res.status(200).json({ success: true });
  }

  // POST /api/admin/users/:username/reset-password
  static async resetUserPassword(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    if (isSelfTarget(req)) {
      sendBadRequest(res, "Change your own password from account settings");
      return;
    }

    const parsed = AdminResetPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const targetId = await AdminService.resetUserPassword(
      req.user.id,
      parsed.data.adminPassword,
      req.params.username,
      parsed.data.newPassword,
    );
    await AdminAuditService.record(req.user, {
      action: "user.reset_password",
      targetType: "user",
      targetId,
      targetLabel: req.params.username,
    });
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

    const targetId = await AdminService.suspendUser(
      req.user.id,
      parsed.data.adminPassword,
      req.params.username,
      parsed.data.reason,
      parsed.data.durationDays,
    );
    const { reason, durationDays } = parsed.data;
    const length = durationDays ? `${durationDays} ${durationDays === 1 ? "day" : "days"}` : null;
    await AdminAuditService.record(req.user, {
      action: "user.suspend",
      targetType: "user",
      targetId,
      targetLabel: req.params.username,
      reason: [reason, length && `(${length})`].filter(Boolean).join(" ") || null,
    });
    res.status(200).json({ success: true });
  }

  // POST /api/admin/users/:username/unsuspend
  static async unsuspendUser(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    const targetId = await AdminService.unsuspendUser(req.params.username);
    await AdminAuditService.record(req.user, {
      action: "user.unsuspend",
      targetType: "user",
      targetId,
      targetLabel: req.params.username,
    });
    res.status(200).json({ success: true });
  }

  // POST /api/admin/users/:username/promote
  static async promoteUser(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    if (isSelfTarget(req)) {
      sendBadRequest(res, "You cannot change your own role");
      return;
    }

    const parsed = AdminPasswordConfirmSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const targetId = await AdminService.promoteUser(req.user.id, parsed.data.adminPassword, req.params.username);
    await AdminAuditService.record(req.user, {
      action: "user.promote",
      targetType: "user",
      targetId,
      targetLabel: req.params.username,
    });
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

    const parsed = AdminPasswordConfirmSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const targetId = await AdminService.demoteUser(req.user.id, parsed.data.adminPassword, req.params.username);
    await AdminAuditService.record(req.user, {
      action: "user.demote",
      targetType: "user",
      targetId,
      targetLabel: req.params.username,
    });
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

    const parsed = AdminPasswordConfirmSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const targetId = await AdminService.deleteUser(req.user.id, parsed.data.adminPassword, req.params.username);
    await AdminAuditService.record(req.user, {
      action: "user.delete",
      targetType: "user",
      targetId,
      targetLabel: req.params.username,
    });
    res.status(200).json({ success: true });
  }
}
