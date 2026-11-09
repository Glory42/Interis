import type { DetailedStats } from "@/features/profile/stats-api";

// Stats only mean something after a handful of logs; visitors don't see the tab before that.
export const STATS_MIN_LOGS = 5;

const MONTH_INITIALS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

export type MonthBar = { key: string; label: string; count: number };
export type RatingBucket = { rating: number; count: number };

// The API leaves out months with no logs; the bars keep them so the axis never jumps.
export const fillLastTwelveMonths = (rows: DetailedStats["entriesPerMonth"], now: Date): MonthBar[] => {
  const counts = new Map(rows.map((row) => [row.month, row.count]));
  return Array.from({ length: 12 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return { key, label: MONTH_INITIALS[date.getMonth()]!, count: counts.get(key) ?? 0 };
  });
};

// Every half step from 1 to 10, empty ones included.
export const toRatingBuckets = (rows: DetailedStats["ratingDistribution"]): RatingBucket[] => {
  const counts = new Map(rows.map((row) => [row.rating, row.count]));
  return Array.from({ length: 19 }, (_, index) => {
    const rating = 1 + index / 2;
    return { rating, count: counts.get(rating) ?? 0 };
  });
};
