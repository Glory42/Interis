import { formatRelativeTime } from "@/lib/time";

export const getRelativeTime = (value: string): string => {
  return formatRelativeTime(value);
};

export const getRating = (rating: number | null): string | null => {
  if (rating === null || Number.isNaN(rating)) {
    return null;
  }

  const normalized = Math.max(0, Math.min(10, rating));
  return normalized.toFixed(1).replace(/\.0$/, "");
};
