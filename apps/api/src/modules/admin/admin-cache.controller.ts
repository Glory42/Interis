import type { Request, Response } from "express";
import { sendValidationError } from "../../commons/http/validation-response.helper";
import { AdminCacheService } from "./admin-cache.service";
import { AdminRefreshOldestSchema } from "./dto/admin-cache.dto";
import { AdminPasswordConfirmSchema } from "./dto/admin.dto";

export class AdminCacheController {
  static async summary(_req: Request, res: Response): Promise<void> {
    res.status(200).json(await AdminCacheService.summary());
  }

  static async refreshOldest(req: Request, res: Response): Promise<void> {
    const parsed = AdminRefreshOldestSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    res.status(200).json(await AdminCacheService.refreshOldest(parsed.data.kind, req.user));
  }

  static async purge(req: Request, res: Response): Promise<void> {
    const parsed = AdminPasswordConfirmSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    res.status(200).json(await AdminCacheService.purgeUnreferenced(req.user, parsed.data.adminPassword));
  }
}
