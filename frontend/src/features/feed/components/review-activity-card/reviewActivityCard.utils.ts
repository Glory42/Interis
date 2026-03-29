export const getRelativeTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const deltaSeconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(deltaSeconds);
  const formatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSeconds < 60) {
    return formatter.format(deltaSeconds, "second");
  }

  const deltaMinutes = Math.round(deltaSeconds / 60);
  if (Math.abs(deltaMinutes) < 60) {
    return formatter.format(deltaMinutes, "minute");
  }

  const deltaHours = Math.round(deltaMinutes / 60);
  if (Math.abs(deltaHours) < 24) {
    return formatter.format(deltaHours, "hour");
  }

  const deltaDays = Math.round(deltaHours / 24);
  return formatter.format(deltaDays, "day");
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
