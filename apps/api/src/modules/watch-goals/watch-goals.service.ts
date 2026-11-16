import type { SetWatchGoalDto } from "./dto/watch-goals.dto";
import { WatchGoalsRepository } from "./repositories/watch-goals.repository";
import { WatchGoalProgressService } from "./services/watch-goal-progress.service";

export class WatchGoalsService {
  static async setGoal(userId: string, year: number, input: SetWatchGoalDto) {
    return WatchGoalsRepository.upsert(userId, year, input.targetFilms, input.targetSeries ?? null);
  }

  static async clearGoal(userId: string, year: number): Promise<boolean> {
    return WatchGoalsRepository.delete(userId, year);
  }

  static async readForProfile(userId: string, query: Record<string, unknown>) {
    return WatchGoalProgressService.readForProfile(userId, query);
  }

  static async getCurrentSummary(userId: string, timeZone: string) {
    return WatchGoalProgressService.getCurrentSummary(userId, timeZone);
  }
}
