export const toRatingOutOfFive = (ratingOutOfTen: number | null): number | null => {
  if (ratingOutOfTen === null || !Number.isFinite(ratingOutOfTen)) {
    return null;
  }
  return Number((ratingOutOfTen / 2).toFixed(1));
};
