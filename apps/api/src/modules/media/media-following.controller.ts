import type { Request, Response } from "express";
import { sendBadRequest } from "../../commons/http/validation-response.helper";
import { parseTmdbIdParam } from "../../commons/validation/params.helper";
import type { MediaType } from "./constants/media-type.constant";
import { MediaFollowingService } from "./services/media-following.service";

// One handler for /api/movies/:tmdbId/following and /api/serials/:tmdbId/following.
export class MediaFollowingController {
  static forMediaType(mediaType: MediaType) {
    return async (req: Request<{ tmdbId: string }>, res: Response): Promise<void> => {
      const tmdbId = parseTmdbIdParam(req.params.tmdbId);
      if (tmdbId === null) {
        sendBadRequest(res, mediaType === "movie" ? "Invalid movie ID" : "Invalid series ID");
        return;
      }

      const following = await MediaFollowingService.forTitle(mediaType, tmdbId, req.user.id);
      res.setHeader("Cache-Control", "no-store");
      res.status(200).json(following);
    };
  }
}
