import type { WatchGoal, WatchGoalPace } from "@/features/profile/goal-api";

export type GoalState = "none" | "upcoming" | "in-progress" | "behind" | "reached" | "missed";

// The widget's headline state: the Film pace leads, a missed Series target holds back "reached".
export const goalStateOf = (goal: WatchGoal): GoalState => {
  if (!goal.goal) return "none";
  if (goal.reached) return "reached";
  const statuses = [goal.films.pace?.status, goal.series.pace?.status];
  if (statuses.includes("missed")) return "missed";
  if (statuses.includes("behind")) return "behind";
  if (statuses.every((status) => status === "upcoming" || status === undefined)) return "upcoming";
  return "in-progress";
};

const plural = (count: number, noun: string) => `${count} ${noun}${count === 1 ? "" : "s"}`;

export const paceLabel = (pace: WatchGoalPace): string => {
  const by = Math.abs(pace.diff);
  switch (pace.status) {
    case "reached":
      return by > 0 ? `Reached · ${by} over` : "Reached";
    case "ahead":
      return `${by} ahead of pace`;
    case "on-pace":
      return "On pace";
    case "behind":
      return `${by} behind pace`;
    case "missed":
      return `Missed by ${by}`;
    case "upcoming":
      return "Starts Jan 1";
  }
};

export const filmCountLabel = (count: number) => plural(count, "film");
export const seriesCountLabel = (count: number) => `${count} series`;

// The pace marker only means something while the year is running.
export const showsPaceMarker = (pace: WatchGoalPace | null): pace is WatchGoalPace =>
  pace !== null && (pace.status === "ahead" || pace.status === "on-pace" || pace.status === "behind");
