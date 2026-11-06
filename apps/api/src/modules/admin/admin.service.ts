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
  ): Promise<string> {
    const [, userRow] = await Promise.all([
      AuthService.assertCurrentPassword(actorId, adminPassword),
      AuthUsersRepository.findByUsername(username),
    ]);
    if (!userRow) {
      throw new BadRequestError("User not found");
    }

    await UsersService.setSuspended(userRow.id, true, reason);
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
