import { z } from "zod";
import { apiRequest, type QueryRequestOptions } from "@/lib/api-client";
import { viewerTimeZone } from "@/lib/time";

export const WATCH_GOAL_MAX_TARGET = 2000;

const paceSchema = z.object({
  status: z.enum(["upcoming", "ahead", "on-pace", "behind", "reached", "missed"]),
  // Titles a steady pace would have reached by today; diff is watched minus that.
  expected: z.number(),
  diff: z.number(),
});

const progressSchema = z.object({
  watched: z.number().int().nonnegative(),
  target: z.number().int().nullable(),
  pace: paceSchema.nullable(),
});

const watchGoalYearSchema = z.object({
  year: z.number().int(),
  targetFilms: z.number().int(),
  targetSeries: z.number().int().nullable(),
});

export const watchGoalSchema = z.object({
  year: z.number().int(),
  today: z.string(),
  goal: z.object({ targetFilms: z.number().int(), targetSeries: z.number().int().nullable() }).nullable(),
  films: progressSchema,
  series: progressSchema,
  reached: z.boolean(),
  // Every year the user has a goal for, newest first.
  years: z.array(watchGoalYearSchema),
});

export type WatchGoal = z.infer<typeof watchGoalSchema>;
export type WatchGoalProgress = z.infer<typeof progressSchema>;
export type WatchGoalPace = z.infer<typeof paceSchema>;
export type SetWatchGoalInput = { targetFilms: number; targetSeries: number | null };

export const getWatchGoal = async (
  username: string,
  year: number,
  options: QueryRequestOptions = {},
): Promise<WatchGoal> => {
  const params = new URLSearchParams({ year: String(year), tz: viewerTimeZone() });
  const response = await apiRequest<unknown>(`/api/users/${encodeURIComponent(username)}/goal?${params}`, {
    method: "GET",
    signal: options.signal,
  });
  return watchGoalSchema.parse(response);
};

export const setWatchGoal = async (year: number, input: SetWatchGoalInput): Promise<void> => {
  await apiRequest<unknown, SetWatchGoalInput>(`/api/users/me/goal/${year}`, { method: "PUT", body: input });
};

export const clearWatchGoal = async (year: number): Promise<void> => {
  await apiRequest<unknown>(`/api/users/me/goal/${year}`, { method: "DELETE" });
};
