import type { Request, Response } from "express";
import { sendBadRequest, sendValidationError } from "../../commons/http/validation-response.helper";
import { parseTmdbIdParam } from "../../commons/validation/params.helper";
import type { MediaType } from "./constants/media-type.constant";
import { WatchProvidersQuerySchema, type WatchProvidersQuery } from "./dto/watch-providers.dto";
import { WatchProvidersService } from "./services/watch-providers.service";

// Same for every viewer and slow to change, so browsers and CDNs may keep it.
const WATCH_PROVIDERS_CACHE_CONTROL = "public, max-age=3600, stale-while-revalidate=86400";

const handleFor =
  (mediaType: MediaType, invalidIdMessage: string) =>
  async (req: Request<{ tmdbId: string }, {}, {}, WatchProvidersQuery>, res: Response): Promise<void> => {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, invalidIdMessage);
      return;
    }

    const parsed = WatchProvidersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await WatchProvidersService.getForRegion(mediaType, tmdbId, parsed.data.region);
    res.setHeader("Cache-Control", WATCH_PROVIDERS_CACHE_CONTROL);
    res.status(200).json(result);
  };

// GET /api/movies/:tmdbId/watch-providers and /api/serials/:tmdbId/watch-providers.
export class WatchProvidersController {
  static getForFilm = handleFor("movie", "Invalid movie ID");
  static getForSeries = handleFor("tv", "Invalid series ID");
}
