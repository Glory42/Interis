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

export const SetWatchGoalSchema = z.object({
  targetFilms: TargetSchema,
  targetSeries: TargetSchema.nullable().optional(),
});

export const WatchGoalQuerySchema = z.object({
  year: YearSchema.optional(),
  tz: z.string().optional(),
});

export type SetWatchGoalDto = z.infer<typeof SetWatchGoalSchema>;
