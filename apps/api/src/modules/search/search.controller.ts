import type { Context } from "hono";
import { sendValidationError } from "../../commons/http/validation-response.hono";
import { SearchService } from "./search.service";
import { SearchQuerySchema } from "./dto/search.dto";

export class SearchController {
  static async searchTitles(c: Context): Promise<Response> {
    const parsed = SearchQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const results = await SearchService.searchTitles(parsed.data.query);
    return c.json(results, 200);
  }
}
