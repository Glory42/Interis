export const resolveRatingOutOfTen = (
  ratingOutOfFive: number | null | undefined,
): number | null | undefined => {
  if (ratingOutOfFive === undefined) {
    return undefined;
  }

  if (ratingOutOfFive === null) {
    return null;
  }

  return Math.round(ratingOutOfFive * 2);
};
