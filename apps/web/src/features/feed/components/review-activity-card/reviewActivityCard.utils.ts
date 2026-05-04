import { formatRelativeTime } from "@/lib/time";

export const getRelativeTime = (value: string): string => {
  return formatRelativeTime(value);
};

export const getRatingOutOfFive = (rating: number | null): string | null => {
  if (rating === null || Number.isNaN(rating)) {
    return null;
  }

  const normalized = Math.max(0, Math.min(10, rating));
  return (normalized / 2).toFixed(1);
};

export const getRoundedStarCount = (ratingOutOfFive: string | null): number => {
  if (ratingOutOfFive === null) {
    return 0;
  }

  const normalized = Number.parseFloat(ratingOutOfFive);
  return Math.max(0, Math.min(5, Math.round(normalized)));
};
