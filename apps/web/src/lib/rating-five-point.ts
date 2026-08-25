// Music and books logs use a 0.5-5 rating scale (distinct from the 0.5-10
// scale movies/serials/diary use - see lib/rating.ts). Kept separate rather
// than folded into the unified 0-10 scale used elsewhere.
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
