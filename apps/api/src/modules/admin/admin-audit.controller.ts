import type { Request, Response } from "express";
import { sendValidationError } from "../../commons/http/validation-response.helper";
import { AdminAuditService } from "./admin-audit.service";
import { AdminAuditQuerySchema } from "./dto/admin.dto";

export class AdminAuditController {
  static async list(req: Request, res: Response): Promise<void> {
    const parsed = AdminAuditQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const page = await AdminAuditService.listPage({
      actorUsername: parsed.data.actor,
      cursor: parsed.data.cursor,
      limit: parsed.data.limit,
    });
    res.status(200).json(page);
  }
}
