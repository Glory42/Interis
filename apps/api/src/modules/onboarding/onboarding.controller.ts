import type { Request, Response } from "express";
import { sendNotFound, sendValidationError } from "../../commons/http/validation-response.helper";
import { SaveTasteSchema } from "./dto/onboarding.dto";
import { OnboardingService } from "./onboarding.service";

export class OnboardingController {
  // GET /api/onboarding/titles → the taste grid (viewer marks come from /api/viewer-status).
  static async getTitles(_req: Request, res: Response): Promise<void> {
    const items = await OnboardingService.getTitles();
    res.setHeader("Cache-Control", "private, max-age=300");
    res.status(200).json({ items });
  }

  // POST /api/onboarding/taste { items: [{ mediaType, tmdbId, watched, rating? }] }
  static async saveTaste(req: Request, res: Response): Promise<void> {
    const parsed = SaveTasteSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await OnboardingService.saveTaste(req.user.id, parsed.data.items);
    res.status(200).json(result);
  }

  // POST /api/onboarding/complete → finished or skipped; never shown again.
  static async complete(req: Request, res: Response): Promise<void> {
    const onboardingCompletedAt = await OnboardingService.complete(req.user.id);
    if (!onboardingCompletedAt) {
      sendNotFound(res, "Profile not found");
      return;
    }
    res.status(200).json({ onboardingCompletedAt });
  }
}
