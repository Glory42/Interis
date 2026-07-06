export const formatRatingLabel = (
  rating: number | null,
): string | null => {
  if (rating === null || Number.isNaN(rating)) {
    return null;
  }

  const normalized = Math.max(0, Math.min(10, Math.round(rating * 10) / 10));

  if (Number.isInteger(normalized)) {
    return `${normalized}/10`;
  }

  return `${normalized.toFixed(1).replace(/\.0$/, "")}/10`;
};
