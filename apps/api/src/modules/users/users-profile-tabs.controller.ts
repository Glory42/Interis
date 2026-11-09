import type { Request, Response } from "express";
import { resolveViewerUserIdFromHeaders } from "../../commons/auth/session-resolver.helper";
import { sendNotFound } from "../../commons/http/validation-response.helper";
import { PublicService } from "../public/public.service";
import { normalizePublicRecentLimit } from "../public/helpers/public-query-normalizer.helper";
import type { PublicRecentQueryDto } from "../public/dto/public.dto";
import { UsersService } from "./users.service";
import type { ProfileTab } from "./services/profile-tabs.service";
import { resolveTimeZone } from "../social/helpers/feed-day.helper";

// The in-app Profile tabs, mounted behind the owner-aware response cache (users.routes.ts).
// res.locals tells the cache whose Profile it is and whether the response is viewer-specific.
export class UsersProfileTabsController {
  // GET /api/users/:username/<tab>
  static tab(tab: ProfileTab) {
    return async (req: Request<{ username: string }>, res: Response): Promise<void> => {
      const read = await UsersService.readProfileTab(req.params.username, tab, req.query, {
        resolveViewerId: () => resolveViewerUserIdFromHeaders(req.headers),
      });
      if (!read) {
        sendNotFound(res, "User not found");
        return;
      }

      res.locals.profileOwnerId = read.ownerId;
      res.locals.viewerSpecific = read.viewerSpecific;
      res.setHeader("Cache-Control", "private, no-store");
      res.status(200).json(read.data);
    };
  }

  private static async send(
    req: Request<{ username: string }>,
    res: Response,
    load: (userId: string) => Promise<unknown>,
  ): Promise<void> {
    const userId = await UsersService.findUserIdByUsername(req.params.username);
    if (!userId) {
      sendNotFound(res, "User not found");
      return;
    }

    res.locals.profileOwnerId = userId;
    const data = await load(userId);
    res.setHeader("Cache-Control", "private, no-store");
    res.status(200).json(data);
  }

  // GET /api/users/:username/recent/grouped?limit=20&tz=Europe/Istanbul
  static async getRecentGrouped(
    req: Request<{ username: string }, unknown, unknown, PublicRecentQueryDto & { tz?: string }>,
    res: Response,
  ): Promise<void> {
    const limit = normalizePublicRecentLimit(req.query.limit);
    const timeZone = resolveTimeZone(req.query.tz);
    await UsersProfileTabsController.send(req, res, (userId) =>
      PublicService.getRecentActivityGroupedByUserId(userId, limit, timeZone),
    );
  }
}
