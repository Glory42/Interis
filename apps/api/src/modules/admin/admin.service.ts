import { BadRequestError, ConflictError, NotFoundError } from "../../commons/errors/app-error";
import { AuthService } from "../auth/auth.service";
import { AuthUsersRepository } from "../auth/repositories/auth-users.repository";
import { SessionService } from "../auth/services/session.service";
import { UsersService } from "../users/users.service";
import { AdminAuditService, type AuditActor } from "./admin-audit.service";
import { AdminRepository } from "./repositories/admin.repository";

const auditUserAction = (actor: AuditActor, action: string, targetId: string, username: string, reason?: string | null) =>
  AdminAuditService.record(actor, { action: `user.${action}`, targetType: "user", targetId, targetLabel: username, reason });

const suspensionReason = (reason: string | undefined, durationDays: number | undefined): string | null => {
  const length = durationDays ? `${durationDays} ${durationDays === 1 ? "day" : "days"}` : null;
  return [reason, length && `(${length})`].filter(Boolean).join(" ") || null;
};

export class AdminService {
  static async listUsers(query: string | undefined, limit: number, offset: number) {
    return AdminRepository.listUsers(query, limit, offset);
  }

  // Account, activity counts and live sessions; refresh-token hashes never leave the server.
  static async getUserDetail(username: string) {
    const account = await AdminRepository.findUserDetail(username);
    if (!account) {
      throw new NotFoundError("User not found");
    }

    const [stats, reportCounts, sessionRows] = await Promise.all([
      UsersService.getStats(account.id),
      AdminRepository.countReports(account.id),
      SessionService.listSessionsForUser(account.id),
    ]);
    const now = Date.now();
    const sessions = sessionRows
      .filter((session) => session.expiresAt.getTime() > now)
      .map(({ id, userAgent, ipAddress, createdAt, updatedAt, expiresAt }) => ({
        id,
        userAgent,
        ipAddress,
        createdAt,
        lastActiveAt: updatedAt,
        expiresAt,
      }));

    return { user: account, counts: { ...stats, ...reportCounts }, sessions };
  }

  static async revokeUserSessions(
    actor: AuditActor,
    adminPassword: string | undefined,
    username: string,
  ): Promise<void> {
    const [, userRow] = await Promise.all([
      AuthService.assertCurrentPassword(actor.id, adminPassword),
      AuthUsersRepository.findByUsername(username),
    ]);
    if (!userRow) {
      throw new BadRequestError("User not found");
    }

    await SessionService.revokeAllSessionsForUser(userRow.id);
    await auditUserAction(actor, "revoke_sessions", userRow.id, username);
  }

  static async forcePasswordReset(
    actor: AuditActor,
    adminPassword: string | undefined,
    username: string,
  ): Promise<void> {
    const [, userRow] = await Promise.all([
      AuthService.assertCurrentPassword(actor.id, adminPassword),
      AuthUsersRepository.findByUsername(username),
    ]);
    if (!userRow) {
      throw new BadRequestError("User not found");
    }

    const { hasRecoveryQuestion } = await AuthService.forcePasswordReset(userRow.id);
    if (!hasRecoveryQuestion) {
      throw new ConflictError("This account has no recovery question, so a forced reset would lock it out");
    }
    await auditUserAction(actor, "force_password_reset", userRow.id, username);
  }

  static async resetUserPassword(
    actor: AuditActor,
    adminPassword: string | undefined,
    username: string,
    newPassword: string,
  ): Promise<void> {
    await AuthService.assertCurrentPassword(actor.id, adminPassword);
    const userRow = await AuthUsersRepository.findByUsername(username);
    await AuthService.adminResetPassword(username, newPassword);
    await auditUserAction(actor, "reset_password", userRow?.id ?? username, username);
  }

  static async suspendUser(
    actor: AuditActor,
    adminPassword: string | undefined,
    username: string,
    reason: string | undefined,
    durationDays?: number,
  ): Promise<void> {
    const [, userRow] = await Promise.all([
      AuthService.assertCurrentPassword(actor.id, adminPassword),
      AuthUsersRepository.findByUsername(username),
    ]);
    if (!userRow) {
      throw new BadRequestError("User not found");
    }

    const until = durationDays ? new Date(Date.now() + durationDays * 86_400_000) : null;
    await UsersService.setSuspended(userRow.id, true, reason, { until, by: actor.id });
    await auditUserAction(actor, "suspend", userRow.id, username, suspensionReason(reason, durationDays));
  }

  static async unsuspendUser(actor: AuditActor, username: string): Promise<void> {
    const userRow = await AuthUsersRepository.findByUsername(username);
    if (!userRow) {
      throw new BadRequestError("User not found");
    }

    await UsersService.setSuspended(userRow.id, false);
    await auditUserAction(actor, "unsuspend", userRow.id, username);
  }

  static async promoteUser(
    actor: AuditActor,
    adminPassword: string | undefined,
    username: string,
  ): Promise<void> {
    const [, userRow] = await Promise.all([
      AuthService.assertCurrentPassword(actor.id, adminPassword),
      AuthUsersRepository.findByUsername(username),
    ]);
    if (!userRow) {
      throw new BadRequestError("User not found");
    }

    await UsersService.setAdminStatus(userRow.id, true);
    await auditUserAction(actor, "promote", userRow.id, username);
  }

  static async demoteUser(
    actor: AuditActor,
    adminPassword: string | undefined,
    username: string,
  ): Promise<void> {
    const [, userRow] = await Promise.all([
      AuthService.assertCurrentPassword(actor.id, adminPassword),
      AuthUsersRepository.findByUsername(username),
    ]);
    if (!userRow) {
      throw new BadRequestError("User not found");
    }

    await UsersService.setAdminStatus(userRow.id, false);
    await auditUserAction(actor, "demote", userRow.id, username);
  }

  static async deleteUser(
    actor: AuditActor,
    adminPassword: string | undefined,
    username: string,
  ): Promise<void> {
    await AuthService.assertCurrentPassword(actor.id, adminPassword);
    const userRow = await AuthUsersRepository.findByUsername(username);
    await AuthService.adminDeleteUser(username);
    await auditUserAction(actor, "delete", userRow?.id ?? username, username);
  }
}
