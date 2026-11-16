import type { Request, Response } from "express";
import { sendValidationError } from "../../commons/http/validation-response.helper";
import { publicCache } from "../../commons/http/cache-control.helper";
import { MEDIA_CACHE_TIMES } from "../media/constants/media-cache-times.constants";
import { SearchService } from "./search.service";
import { SearchQuerySchema, type SearchQuery } from "./dto/search.dto";

export class SearchController {
  static async searchTitles(
    req: Request<{}, {}, {}, SearchQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = SearchQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const results = await SearchService.searchTitles(parsed.data.query);
    publicCache(res, MEDIA_CACHE_TIMES.search);
    res.status(200).json(results);
  }
}
