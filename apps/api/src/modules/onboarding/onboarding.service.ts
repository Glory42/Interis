import type { TasteItemDto } from "./dto/onboarding.dto";
import { OnboardingRepository } from "./repositories/onboarding.repository";
import { OnboardingTasteService } from "./services/onboarding-taste.service";
import { OnboardingTitlesService } from "./services/onboarding-titles.service";

// The first-run flow: seed your taste, then find people to follow.
export class OnboardingService {
  static async getTitles() {
    return OnboardingTitlesService.getTitles();
  }

  static async saveTaste(userId: string, items: TasteItemDto[]) {
    return OnboardingTasteService.save(userId, items);
  }

  static async complete(userId: string) {
    return OnboardingRepository.markCompleted(userId);
  }
}
