export type MediaRatingBreakdownBucket = {
  ratingValue: number;
  count: number;
  percentage: number;
};

type RatedReviewLike = {
  rating: number | null;
};

export const buildMediaRatingBreakdown = (
  rows: RatedReviewLike[],
): {
  totalRatedReviews: number;
  averageRating: number | null;
  buckets: MediaRatingBreakdownBucket[];
} => {
  const ratedRows = rows.filter((row) => row.rating !== null);
  const ratingBucketCount = new Map<number, number>([
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
    [6, 0],
    [7, 0],
    [8, 0],
    [9, 0],
    [10, 0],
  ]);

  for (const ratedRow of ratedRows) {
    if (ratedRow.rating === null) {
      continue;
    }

    const bucket = Math.max(1, Math.min(10, Math.round(ratedRow.rating)));
    ratingBucketCount.set(bucket, (ratingBucketCount.get(bucket) ?? 0) + 1);
  }

  const totalRatedReviews = ratedRows.length;
  const averageRating =
    totalRatedReviews > 0
      ? Number(
          (
            ratedRows.reduce((sum, ratedRow) => {
              return sum + (ratedRow.rating ?? 0);
            }, 0) / totalRatedReviews
          ).toFixed(2),
        )
      : null;

  const buckets: MediaRatingBreakdownBucket[] = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(
    (ratingValue) => {
      const count = ratingBucketCount.get(ratingValue) ?? 0;

      return {
        ratingValue,
        count,
        percentage:
          totalRatedReviews > 0 ? Math.round((count / totalRatedReviews) * 100) : 0,
      };
    },
  );

  return {
    totalRatedReviews,
    averageRating,
    buckets,
  };
};
