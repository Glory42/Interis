// Standard IMDB-style Bayesian weighted rating: pulls a title's score
// toward the population mean until its vote count approaches
// `minVotesForConfidence`, so titles with only a handful of votes can't
// outrank a blockbuster with a slightly lower but far more reliable average.
const GLOBAL_MEAN_RATING_OUT_OF_TEN = 6.5;

export const computeWeightedTmdbRating = (
  ratingOutOfTen: number | null,
  voteCount: number | null,
  minVotesForConfidence: number,
): number | null => {
  if (ratingOutOfTen === null) {
    return null;
  }

  const v = voteCount ?? 0;
  const m = minVotesForConfidence;

  return (v / (v + m)) * ratingOutOfTen + (m / (v + m)) * GLOBAL_MEAN_RATING_OUT_OF_TEN;
};

type WeightedRatingSource = {
  tmdbRatingOutOfTen: number | null;
  tmdbVoteCount: number | null;
};

// Scores are computed once per item up front (decorate-sort-undecorate)
// rather than inside the comparator, which would recompute the same item's
// score on every comparison across the O(n log n) sort.
export const sortByWeightedTmdbRatingDesc = <T extends WeightedRatingSource>(
  items: T[],
  minVotesForConfidence: number,
  tieBreak: (left: T, right: T) => number,
): T[] => {
  const decorated = items.map((item) => ({
    item,
    score: computeWeightedTmdbRating(
      item.tmdbRatingOutOfTen,
      item.tmdbVoteCount,
      minVotesForConfidence,
    ),
  }));

  decorated.sort((left, right) => {
    if (left.score === null && right.score !== null) {
      return 1;
    }

    if (left.score !== null && right.score === null) {
      return -1;
    }

    if (left.score !== null && right.score !== null && right.score !== left.score) {
      return right.score - left.score;
    }

    return tieBreak(left.item, right.item);
  });

  return decorated.map((decoratedItem) => decoratedItem.item);
};
