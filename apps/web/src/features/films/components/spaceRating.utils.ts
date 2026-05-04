export const toFivePointFromTen = (ratingOutOfTen: number | null): number | null => {
  if (ratingOutOfTen === null || Number.isNaN(ratingOutOfTen)) {
    return null;
  }

  return Math.max(0, Math.min(5, ratingOutOfTen / 2));
};

export const toTenPointFromFive = (ratingOutOfFive: number | null): number | null => {
  if (ratingOutOfFive === null || Number.isNaN(ratingOutOfFive)) {
    return null;
  }

  return Math.max(0, Math.min(10, ratingOutOfFive * 2));
};

export const formatRatingOutOfFiveLabel = (
  ratingOutOfFive: number | null,
): string | null => {
  if (ratingOutOfFive === null || Number.isNaN(ratingOutOfFive)) {
    return null;
  }

  const normalized = Math.max(0, Math.min(5, Math.round(ratingOutOfFive * 10) / 10));

  if (Number.isInteger(normalized)) {
    return `${normalized}/5`;
  }

  return `${normalized.toFixed(1).replace(/\.0$/, "")}/5`;
};
