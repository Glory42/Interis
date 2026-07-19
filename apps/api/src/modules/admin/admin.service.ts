import { AuthService } from "../auth/auth.service";
import { AdminRepository } from "./repositories/admin.repository";

export class AdminService {
  static async listUsers(query: string | undefined, limit: number, offset: number) {
    return AdminRepository.listUsers(query, limit, offset);
  }

  static async resetUserPassword(username: string, newPassword: string): Promise<void> {
    await AuthService.adminResetPassword(username, newPassword);
  }
}
