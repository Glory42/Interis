export type MediaRatingBreakdownBucket = {
  ratingValueOutOfFive: 1 | 2 | 3 | 4 | 5;
  count: number;
  percentage: number;
};

type RatedReviewLike = {
  ratingOutOfTen: number | null;
  ratingOutOfFive: number | null;
};

export const buildMediaRatingBreakdown = (
  rows: RatedReviewLike[],
  toBucket: (ratingOutOfTen: number) => 1 | 2 | 3 | 4 | 5,
): {
  totalRatedReviews: number;
  averageRatingOutOfFive: number | null;
  buckets: MediaRatingBreakdownBucket[];
} => {
  const ratedRows = rows.filter((row) => row.ratingOutOfTen !== null);
  const ratingBucketCount = new Map<1 | 2 | 3 | 4 | 5, number>([
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
  ]);

  for (const ratedRow of ratedRows) {
    if (ratedRow.ratingOutOfTen === null) {
      continue;
    }

    const bucket = toBucket(ratedRow.ratingOutOfTen);
    ratingBucketCount.set(bucket, (ratingBucketCount.get(bucket) ?? 0) + 1);
  }

  const totalRatedReviews = ratedRows.length;
  const averageRatingOutOfFive =
    totalRatedReviews > 0
      ? Number(
          (
            ratedRows.reduce((sum, ratedRow) => {
              return sum + (ratedRow.ratingOutOfFive ?? 0);
            }, 0) / totalRatedReviews
          ).toFixed(2),
        )
      : null;

  const buckets: MediaRatingBreakdownBucket[] = [5, 4, 3, 2, 1].map(
    (ratingValueOutOfFive) => {
      const count = ratingBucketCount.get(ratingValueOutOfFive as 1 | 2 | 3 | 4 | 5) ?? 0;

      return {
        ratingValueOutOfFive: ratingValueOutOfFive as 1 | 2 | 3 | 4 | 5,
        count,
        percentage:
          totalRatedReviews > 0 ? Math.round((count / totalRatedReviews) * 100) : 0,
      };
    },
  );

  return {
    totalRatedReviews,
    averageRatingOutOfFive,
    buckets,
  };
};
