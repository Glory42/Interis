import type { Request, Response } from "express";
import { sendNotFound } from "../../commons/http/validation-response.helper";
import { PublicService } from "../public/public.service";
import {
  normalizePublicCollectionLimit,
  normalizePublicCurrentlyWatchingLimit,
  normalizePublicDiaryOffset,
  normalizePublicRecentLimit,
} from "../public/helpers/public-query-normalizer.helper";
import type {
  PublicCurrentlyWatchingQueryDto,
  PublicDiaryQueryDto,
  PublicRecentQueryDto,
} from "../public/dto/public.dto";

// The in-app profile tabs that share the widget API's data. /api/public keeps
// a 5-minute response cache for external widgets; these serve the same payloads
// uncached so a user sees their own changes on their profile immediately.
export class UsersProfileTabsController {
  private static send(res: Response, data: unknown): void {
    if (!data) {
      sendNotFound(res, "User not found");
      return;
    }
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json(data);
  }

  // GET /api/users/:username/diary?limit=50&offset=0
  static async getDiary(
    req: Request<{ username: string }, unknown, unknown, PublicDiaryQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizePublicCollectionLimit(req.query.limit);
    const offset = normalizePublicDiaryOffset(req.query.offset);
    UsersProfileTabsController.send(
      res,
      await PublicService.getDiary(req.params.username, limit, offset),
    );
  }

  // GET /api/users/:username/top4
  static async getTop4(req: Request<{ username: string }>, res: Response): Promise<void> {
    UsersProfileTabsController.send(res, await PublicService.getTop4(req.params.username));
  }

  // GET /api/users/:username/recent?limit=10
  static async getRecent(
    req: Request<{ username: string }, unknown, unknown, PublicRecentQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizePublicRecentLimit(req.query.limit);
    UsersProfileTabsController.send(
      res,
      await PublicService.getRecentActivity(req.params.username, limit),
    );
  }

  // GET /api/users/:username/serials/currently-watching?limit=10
  static async getSerialsCurrentlyWatching(
    req: Request<{ username: string }, unknown, unknown, PublicCurrentlyWatchingQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizePublicCurrentlyWatchingLimit(req.query.limit);
    UsersProfileTabsController.send(
      res,
      await PublicService.getSerialsCurrentlyWatching(req.params.username, limit),
    );
  }
}
