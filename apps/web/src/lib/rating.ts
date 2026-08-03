/** Formats a 0–10 rating as "X/10" with up to one decimal place, or null if input is null. */
export const formatRatingLabel = (
  rating: number | null,
  options?: { withSuffix?: boolean },
): string | null => {
  if (rating === null || Number.isNaN(rating)) return null;
  const withSuffix = options?.withSuffix ?? true;
  const normalized = Math.max(0, Math.min(10, Math.round(rating * 10) / 10));
  const formatted = Number.isInteger(normalized)
    ? `${normalized}`
    : normalized.toFixed(1).replace(/\.0$/, "");
  return withSuffix ? `${formatted}/10` : formatted;
};
