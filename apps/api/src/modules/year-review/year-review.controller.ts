import type { Request, Response } from "express";
import { sendNotFound, sendValidationError } from "../../commons/http/validation-response.helper";
import { YearReviewParamsSchema, currentYearReviewYear } from "./dto/year-review.dto";
import { YearReviewService } from "./year-review.service";

// Mirrors the in-process cache TTLs; the same JSON for every viewer, so shared caches may keep it.
const CURRENT_YEAR_CACHE_CONTROL = "public, max-age=300, s-maxage=600";
const PAST_YEAR_CACHE_CONTROL = "public, max-age=3600, s-maxage=21600";
const NOT_FOUND_CACHE_CONTROL = "public, max-age=60";

export class YearReviewController {
  // GET /api/users/:username/year/:year
  static async read(req: Request<{ username: string; year: string }>, res: Response): Promise<void> {
    const params = YearReviewParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendValidationError(res, params.error);
      return;
    }

    const { username, year } = params.data;
    const review = await YearReviewService.read(username, year);
    if (!review) {
      res.setHeader("Cache-Control", NOT_FOUND_CACHE_CONTROL);
      sendNotFound(res, "User not found");
      return;
    }

    res.setHeader("Cache-Control", year === currentYearReviewYear() ? CURRENT_YEAR_CACHE_CONTROL : PAST_YEAR_CACHE_CONTROL);
    res.status(200).json(review);
  }
}
