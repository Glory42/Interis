export const WATCH_GOAL_MIN_YEAR = 2000;
export const WATCH_GOAL_MAX_TARGET = 2000;

// Next year's goal can be set ahead of time, nothing further out.
export const maxWatchGoalYear = (now = new Date()): number => now.getUTCFullYear() + 1;

export type WatchGoalPaceStatus = "upcoming" | "ahead" | "on-pace" | "behind" | "reached" | "missed";

// expected: titles a steady pace would have reached by today; diff: watched minus that.
export type WatchGoalPace = { status: WatchGoalPaceStatus; expected: number; diff: number };

const DAY_MS = 86_400_000;

// `today` is the viewer's calendar day ("YYYY-MM-DD"); the day itself counts as elapsed.
export const computeWatchGoalPace = (
  target: number,
  watched: number,
  year: number,
  today: string,
): WatchGoalPace => {
  const [todayYear = year, month = 1, day = 1] = today.split("-").map(Number);
  if (watched >= target) return { status: "reached", expected: target, diff: watched - target };
  if (year < todayYear) return { status: "missed", expected: target, diff: watched - target };
  if (year > todayYear) return { status: "upcoming", expected: 0, diff: watched };

  const dayOfYear = (Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 1)) / DAY_MS + 1;
  const daysInYear = (Date.UTC(year + 1, 0, 1) - Date.UTC(year, 0, 1)) / DAY_MS;
  const expected = Math.round((target * dayOfYear) / daysInYear);
  const diff = watched - expected;
  return { status: diff > 0 ? "ahead" : diff < 0 ? "behind" : "on-pace", expected, diff };
};
