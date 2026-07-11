type RatingRow = { userId: string; rating: number | null };

// Community rating source: every diary-entry rating (one per logged
// watch/rewatch, matching Letterboxd-style per-log averaging), plus the
// interaction (star-widget) rating for any user who rated the item that
// way WITHOUT ever logging a diary entry for it. A user's diary rating(s)
// take precedence over their interaction rating so the same opinion is
// never double-counted - mirrors the frontend's own precedence
// (interaction rating falls back to diary rating) for "Your Rating", just
// inverted for aggregation purposes. Shared between movies and serials
// since both apply the identical diary-vs-interaction precedence rule.
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
