import type { MonthBar } from "@/features/profile/components/stats/stats-model";
import type { YearReview } from "@/features/year-review/api";

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTH_INITIALS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MONTH_SHORT = MONTH_NAMES.map((name) => name.slice(0, 3));

// The first year with a Year in Review (the API's lower bound).
export const YEAR_REVIEW_MIN_YEAR = 2000;

export const yearHeading = (review: Pick<YearReview, "year" | "isPartialYear">) =>
  review.isPartialYear ? `${review.year} so far` : `${review.year} in review`;

export const formatCount = (value: number) => value.toLocaleString("en-US");

export const plural = (count: number, one: string, many = `${one}s`) => `${formatCount(count)} ${count === 1 ? one : many}`;

// "YYYY-MM-DD" as "Mar 10", read as a calendar date (no time zone shift).
export const formatDay = (day: string) => {
  const [, month, date] = day.split("-").map(Number);
  return `${MONTH_SHORT[(month ?? 1) - 1]} ${date}`;
};

// The twelve months as the Stats page's MonthBars expects them.
export const toMonthBars = (review: Pick<YearReview, "year" | "months">): MonthBar[] =>
  review.months.map((row) => ({
    key: `${review.year}-${String(row.month).padStart(2, "0")}`,
    label: MONTH_INITIALS[row.month - 1] ?? "",
    count: row.count,
  }));

// "+12 vs 2025" / "−3 vs 2025" / "same as 2025".
export const compareWith = (current: number, previous: number, previousYear: number) => {
  const diff = current - previous;
  if (diff === 0) return `same as ${previousYear}`;
  return `${diff > 0 ? "+" : "−"}${formatCount(Math.abs(diff))} vs ${previousYear}`;
};

// The heatmap draws up to "today": the real day for the current year, Dec 31 for a past one.
export const heatmapEnd = (review: Pick<YearReview, "year" | "isPartialYear">, now: Date) =>
  review.isPartialYear ? now : new Date(review.year, 11, 31);

// Years for the selector: those with logs, the current year and the one on screen, newest first.
export const selectableYears = (review: Pick<YearReview, "year" | "availableYears">, now: Date) =>
  [...new Set([now.getFullYear(), review.year, ...review.availableYears])]
    .filter((year) => year >= YEAR_REVIEW_MIN_YEAR && year <= now.getFullYear())
    .sort((a, b) => b - a);

// Recap season: Dec 1 to Jan 15 (the viewer's local dates). January still celebrates last year.
export const isRecapSeason = (now: Date) =>
  now.getMonth() === 11 || (now.getMonth() === 0 && now.getDate() <= 15);

// The year the entry points link to: last year until Jan 15, this year after that.
export const recapYearFor = (now: Date) =>
  now.getMonth() === 0 && now.getDate() <= 15 ? now.getFullYear() - 1 : now.getFullYear();

export const recapPath = (username: string, year: number) =>
  `/profile/${encodeURIComponent(username)}/year/${year}`;
