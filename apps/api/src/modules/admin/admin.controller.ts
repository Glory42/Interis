import type { Request, Response } from "express";
import { sendValidationError } from "../../commons/http/validation-response.helper";
import { AdminService } from "./admin.service";
import { ListUsersQuerySchema, type ListUsersQuery } from "./dto/admin.dto";

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
}
