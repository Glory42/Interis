import type { DetailedStats } from "@/features/profile/stats-api";

export type HeatLevel = 0 | 1 | 2 | 3 | 4;
// null is a slot outside the year so far (before Jan 1 or after today).
export type HeatDay = { key: string; label: string; count: number; level: HeatLevel } | null;
export type HeatWeek = { key: string; month: string | null; days: HeatDay[] };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const heatLevelFor = (count: number): HeatLevel => (count >= 4 ? 4 : (count as HeatLevel));

const dayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const dayLabel = (date: Date, count: number): string =>
  `${count} ${count === 1 ? "log" : "logs"} on ${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;

// Monday-first week columns from the week of Jan 1 to this week; a month is named on its first column.
export const toDayHeatmap = (rows: DetailedStats["logsPerDay"], now: Date): HeatWeek[] => {
  const counts = new Map(rows.map((row) => [row.day, row.count]));
  const year = now.getFullYear();
  const today = new Date(year, now.getMonth(), now.getDate());
  const firstMonday = new Date(year, 0, 1 - ((new Date(year, 0, 1).getDay() + 6) % 7));

  const weeks: HeatWeek[] = [];
  let previousMonth = -1;
  for (let start = firstMonday; start <= today; start = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7)) {
    const dates = Array.from({ length: 7 }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
    const days = dates.map((date): HeatDay => {
      if (date.getFullYear() !== year || date > today) return null;
      const count = counts.get(dayKey(date)) ?? 0;
      return { key: dayKey(date), label: dayLabel(date, count), count, level: heatLevelFor(count) };
    });
    const month = dates.find((date) => date.getFullYear() === year)!.getMonth();
    weeks.push({ key: dayKey(start), month: month !== previousMonth ? MONTHS[month]! : null, days });
    previousMonth = month;
  }
  return weeks;
};
