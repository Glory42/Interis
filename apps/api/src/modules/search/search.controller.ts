import type { Request, Response } from "express";
import { sendValidationError } from "../../commons/http/validation-response.helper";
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
    res.status(200).json(results);
  }
}
