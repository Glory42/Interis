import type { Request, Response } from "express";
import { sendValidationError } from "../../commons/http/validation-response.helper";
import { resolveTimeZone } from "../social/helpers/feed-day.helper";
import { UpNextQuerySchema } from "./dto/tv-up-next.dto";
import { TvUpNextService } from "./services/tv-up-next.service";

export class TvUpNextController {
  // GET /api/serials/up-next?tz=…
  static async getUpNext(req: Request, res: Response): Promise<void> {
    const parsed = UpNextQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    res.status(200).json(await TvUpNextService.getUpNext(req.user.id, resolveTimeZone(parsed.data.tz)));
  }
}
