import { z } from "zod";
import { AppError } from "../../../commons/errors/app-error";
import { resolveTimeZone, toDayKey } from "../../social/helpers/feed-day.helper";
import { WatchGoalQuerySchema } from "../dto/watch-goals.dto";
import { computeWatchGoalPace } from "../helpers/watch-goal-pace.helper";
import { WatchGoalsRepository } from "../repositories/watch-goals.repository";

const progressOf = (watched: number, target: number | null, year: number, today: string) => ({
  watched,
  target,
  pace: target === null ? null : computeWatchGoalPace(target, watched, year, today),
});

// Reached once every target the user set is met.
const isReached = (filmsWatched: number, targetFilms: number, seriesWatched: number, targetSeries: number | null) =>
  filmsWatched >= targetFilms && (targetSeries === null || seriesWatched >= targetSeries);

export class WatchGoalProgressService {
  // A Profile's goal for `year` (default: the viewer's current year), read as a Profile Tab.
  static async readForProfile(userId: string, query: Record<string, unknown>) {
    const parsed = WatchGoalQuerySchema.safeParse(query);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Validation failed", z.flattenError(parsed.error));
    }
    const today = toDayKey(new Date(), resolveTimeZone(parsed.data.tz));
    const year = parsed.data.year ?? Number(today.slice(0, 4));
    const row = await WatchGoalsRepository.findWithProgress(userId, year);
    const goal =
      row.targetFilms === null
        ? null
        : { targetFilms: row.targetFilms, targetSeries: row.targetSeries, updatedAt: row.updatedAt };

    return {
      year,
      today,
      goal,
      films: progressOf(row.filmsWatched, row.targetFilms, year, today),
      series: progressOf(row.seriesWatched, row.targetSeries, year, today),
      reached: goal ? isReached(row.filmsWatched, goal.targetFilms, row.seriesWatched, goal.targetSeries) : false,
      years: row.years,
    };
  }

  // The current year's goal for the feed's "goal reached" moment; null without one.
  static async getCurrentSummary(userId: string, timeZone: string) {
    const year = Number(toDayKey(new Date(), timeZone).slice(0, 4));
    const row = await WatchGoalsRepository.findGoalProgress(userId, year);
    if (!row) return null;
    return {
      year,
      ...row,
      reached: isReached(row.filmsWatched, row.targetFilms, row.seriesWatched, row.targetSeries),
    };
  }
}
