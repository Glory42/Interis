import { BadRequestError, NotFoundError } from "../../commons/errors/app-error";
import { AuthService } from "../auth/auth.service";
import { AuthUsersRepository } from "../auth/repositories/auth-users.repository";
import { SessionService } from "../auth/services/session.service";
import { UsersService } from "../users/users.service";
import { AdminRepository } from "./repositories/admin.repository";

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
    actorId: string,
    adminPassword: string | undefined,
    username: string,
  ): Promise<string> {
    const [, userRow] = await Promise.all([
      AuthService.assertCurrentPassword(actorId, adminPassword),
      AuthUsersRepository.findByUsername(username),
    ]);
    if (!userRow) {
      throw new BadRequestError("User not found");
    }

    await SessionService.revokeAllSessionsForUser(userRow.id);
    return userRow.id;
  }

  static async resetUserPassword(
    actorId: string,
    adminPassword: string | undefined,
    username: string,
    newPassword: string,
  ): Promise<string> {
    await AuthService.assertCurrentPassword(actorId, adminPassword);
    const userRow = await AuthUsersRepository.findByUsername(username);
    await AuthService.adminResetPassword(username, newPassword);
    return userRow?.id ?? username;
  }

  static async suspendUser(
    actorId: string,
    adminPassword: string | undefined,
    username: string,
    reason: string | undefined,
    durationDays?: number,
  ): Promise<string> {
    const [, userRow] = await Promise.all([
      AuthService.assertCurrentPassword(actorId, adminPassword),
      AuthUsersRepository.findByUsername(username),
    ]);
    if (!userRow) {
      throw new BadRequestError("User not found");
    }

    const until = durationDays ? new Date(Date.now() + durationDays * 86_400_000) : null;
    await UsersService.setSuspended(userRow.id, true, reason, { until, by: actorId });
    return userRow.id;
  }

  static async unsuspendUser(username: string): Promise<string> {
    const userRow = await AuthUsersRepository.findByUsername(username);
    if (!userRow) {
      throw new BadRequestError("User not found");
    }

    await UsersService.setSuspended(userRow.id, false);
    return userRow.id;
  }

  static async promoteUser(
    actorId: string,
    adminPassword: string | undefined,
    username: string,
  ): Promise<string> {
    const [, userRow] = await Promise.all([
      AuthService.assertCurrentPassword(actorId, adminPassword),
      AuthUsersRepository.findByUsername(username),
    ]);
    if (!userRow) {
      throw new BadRequestError("User not found");
    }

    await UsersService.setAdminStatus(userRow.id, true);
    return userRow.id;
  }

  static async demoteUser(
    actorId: string,
    adminPassword: string | undefined,
    username: string,
  ): Promise<string> {
    const [, userRow] = await Promise.all([
      AuthService.assertCurrentPassword(actorId, adminPassword),
      AuthUsersRepository.findByUsername(username),
    ]);
    if (!userRow) {
      throw new BadRequestError("User not found");
    }

    await UsersService.setAdminStatus(userRow.id, false);
    return userRow.id;
  }

  static async deleteUser(
    actorId: string,
    adminPassword: string | undefined,
    username: string,
  ): Promise<string> {
    await AuthService.assertCurrentPassword(actorId, adminPassword);
    const userRow = await AuthUsersRepository.findByUsername(username);
    await AuthService.adminDeleteUser(username);
    return userRow?.id ?? username;
  }
}
