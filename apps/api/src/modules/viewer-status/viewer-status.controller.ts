import type { Request, Response } from "express";
import { resolveViewerUserIdFromHeaders } from "../../commons/auth/session-resolver.helper";
import { sendValidationError } from "../../commons/http/validation-response.helper";
import { ViewerStatusQuerySchema } from "./dto/viewer-status.dto";
import { ViewerStatusService } from "./viewer-status.service";

export class ViewerStatusController {
  static async getStatuses(req: Request, res: Response): Promise<void> {
    const parsed = ViewerStatusQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);
    const items = await ViewerStatusService.getStatuses(viewerUserId, parsed.data.items);

    // Viewer-specific: never cache in shared caches.
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json({ items });
  }
}
