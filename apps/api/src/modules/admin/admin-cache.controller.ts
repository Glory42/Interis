import type { Request, Response } from "express";
import { sendValidationError } from "../../commons/http/validation-response.helper";
import { AdminCacheService } from "./admin-cache.service";
import { AdminAuditService } from "./admin-audit.service";
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

    const result = await AdminCacheService.refreshOldest(parsed.data.kind);
    await AdminAuditService.record(req.user, {
      action: "cache.refresh_oldest",
      targetType: parsed.data.kind,
      targetId: "oldest",
      targetLabel: `${result.titles.filter((title) => title.ok).length} of ${result.titles.length} refreshed`,
    });
    res.status(200).json(result);
  }

  static async purge(req: Request, res: Response): Promise<void> {
    const parsed = AdminPasswordConfirmSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const purged = await AdminCacheService.purgeUnreferenced(req.user.id, parsed.data.adminPassword);
    await AdminAuditService.record(req.user, {
      action: "cache.purge",
      targetType: "cache",
      targetId: "unreferenced",
      targetLabel: `${purged.movies} films, ${purged.serials} series`,
    });
    res.status(200).json(purged);
  }
}
