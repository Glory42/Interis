type RatingRow = { userId: string; rating: number | null };

// Community rating = every diary-entry rating, plus each user's
// interaction rating only if they never logged a diary entry for the item -
// a user's diary rating(s) take precedence so the same opinion isn't
// double-counted. Mirrors the frontend's own diary-over-interaction
// precedence for "Your Rating", inverted for aggregation.
export const mergeCommunityRatings = (
  diaryRatingRows: RatingRow[],
  interactionRatingRows: RatingRow[],
): { rating: number }[] => {
  const usersWithDiaryRating = new Set(diaryRatingRows.map((row) => row.userId));
  const interactionOnlyRatingRows = interactionRatingRows.filter(
    (row) => !usersWithDiaryRating.has(row.userId),
  );

  return [
    ...diaryRatingRows.map((row) => ({ rating: row.rating as number })),
    ...interactionOnlyRatingRows.map((row) => ({ rating: row.rating as number })),
  ];
};
