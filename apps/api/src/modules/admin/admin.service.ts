import { BadRequestError } from "../../commons/errors/app-error";
import { AuthService } from "../auth/auth.service";
import { AuthUsersRepository } from "../auth/repositories/auth-users.repository";
import { UsersService } from "../users/users.service";
import { AdminRepository } from "./repositories/admin.repository";

export class AdminService {
  static async listUsers(query: string | undefined, limit: number, offset: number) {
    return AdminRepository.listUsers(query, limit, offset);
  }

  static async resetUserPassword(
    actorId: string,
    adminPassword: string | undefined,
    username: string,
    newPassword: string,
  ): Promise<void> {
    await AuthService.assertCurrentPassword(actorId, adminPassword);
    await AuthService.adminResetPassword(username, newPassword);
  }

  static async suspendUser(
    actorId: string,
    adminPassword: string | undefined,
    username: string,
    reason: string | undefined,
  ): Promise<void> {
    const [, userRow] = await Promise.all([
      AuthService.assertCurrentPassword(actorId, adminPassword),
      AuthUsersRepository.findByUsername(username),
    ]);
    if (!userRow) {
      throw new BadRequestError("User not found");
    }

    await UsersService.setSuspended(userRow.id, true, reason);
  }

  static async unsuspendUser(username: string): Promise<void> {
    const userRow = await AuthUsersRepository.findByUsername(username);
    if (!userRow) {
      throw new BadRequestError("User not found");
    }

    await UsersService.setSuspended(userRow.id, false);
  }

  static async promoteUser(
    actorId: string,
    adminPassword: string | undefined,
    username: string,
  ): Promise<void> {
    const [, userRow] = await Promise.all([
      AuthService.assertCurrentPassword(actorId, adminPassword),
      AuthUsersRepository.findByUsername(username),
    ]);
    if (!userRow) {
      throw new BadRequestError("User not found");
    }

    await UsersService.setAdminStatus(userRow.id, true);
  }

  static async demoteUser(
    actorId: string,
    adminPassword: string | undefined,
    username: string,
  ): Promise<void> {
    const [, userRow] = await Promise.all([
      AuthService.assertCurrentPassword(actorId, adminPassword),
      AuthUsersRepository.findByUsername(username),
    ]);
    if (!userRow) {
      throw new BadRequestError("User not found");
    }

    await UsersService.setAdminStatus(userRow.id, false);
  }

  static async deleteUser(
    actorId: string,
    adminPassword: string | undefined,
    username: string,
  ): Promise<void> {
    await AuthService.assertCurrentPassword(actorId, adminPassword);
    await AuthService.adminDeleteUser(username);
  }
}
