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

// The in-app profile tabs that share the widget API's data. Mounted behind an
// owner-aware response cache (users.routes.ts): other viewers get cached
// copies, while the profile owner always gets fresh data so their own changes
// show immediately. res.locals.profileOwnerId tells the cache whose profile it is.
export class UsersProfileTabsController {
  private static async send(
    req: Request<{ username: string }>,
    res: Response,
    load: (userId: string) => Promise<unknown>,
  ): Promise<void> {
    const userId = await PublicService.findUserIdByUsername(req.params.username);
    if (!userId) {
      sendNotFound(res, "User not found");
      return;
    }

    res.locals.profileOwnerId = userId;
    const data = await load(userId);
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
    await UsersProfileTabsController.send(req, res, (userId) =>
      PublicService.getDiaryByUserId(userId, limit, offset),
    );
  }

  // GET /api/users/:username/top4
  static async getTop4(req: Request<{ username: string }>, res: Response): Promise<void> {
    await UsersProfileTabsController.send(req, res, (userId) =>
      PublicService.getTop4ByUserId(userId),
    );
  }

  // GET /api/users/:username/recent?limit=10
  static async getRecent(
    req: Request<{ username: string }, unknown, unknown, PublicRecentQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizePublicRecentLimit(req.query.limit);
    await UsersProfileTabsController.send(req, res, (userId) =>
      PublicService.getRecentActivityByUserId(userId, limit),
    );
  }

  // GET /api/users/:username/serials/currently-watching?limit=10
  static async getSerialsCurrentlyWatching(
    req: Request<{ username: string }, unknown, unknown, PublicCurrentlyWatchingQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizePublicCurrentlyWatchingLimit(req.query.limit);
    await UsersProfileTabsController.send(req, res, (userId) =>
      PublicService.getSerialsCurrentlyWatchingByUserId(userId, limit),
    );
  }
}
