import { z } from "zod";
import { WATCH_GOAL_MAX_TARGET, WATCH_GOAL_MIN_YEAR, maxWatchGoalYear } from "../helpers/watch-goal-pace.helper";

const TargetSchema = z.number().int().min(1).max(WATCH_GOAL_MAX_TARGET);

// Checked at request time so the upper bound moves with the calendar.
const YearSchema = z.coerce
  .number()
  .int()
  .min(WATCH_GOAL_MIN_YEAR)
  .refine((year) => year <= maxWatchGoalYear(), { message: "Year is too far ahead" });

export const WatchGoalYearParamsSchema = z.object({ year: YearSchema });

// Films, TV or both: each target is optional, but a goal needs at least one.
export const SetWatchGoalSchema = z
  .object({
    targetFilms: TargetSchema.nullable().optional(),
    targetSeries: TargetSchema.nullable().optional(),
  })
  .refine((goal) => goal.targetFilms != null || goal.targetSeries != null, {
    message: "Set a Film or TV target",
    path: ["targetFilms"],
  });

export const WatchGoalQuerySchema = z.object({
  year: YearSchema.optional(),
  tz: z.string().optional(),
});

export type SetWatchGoalDto = z.infer<typeof SetWatchGoalSchema>;
