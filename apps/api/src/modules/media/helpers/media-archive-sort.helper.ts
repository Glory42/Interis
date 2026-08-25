import { sortByWeightedTmdbRatingDesc } from "./media-weighted-rating.helper";

// Shared by the movies and serials archive sort logic - identical rules
// (trending/date/logs/user-rating/tmdb-rating/title) for both media types,
// parameterized by the date comparators and confidence constant each module
// tunes separately.
export type ArchiveSortKind =
  | "trending"
  | "date_desc"
  | "date_asc"
  | "logs_desc"
  | "rating_user_desc"
  | "rating_tmdb_desc"
  | "title_asc";

type SortableArchiveItem = {
  logCount: number;
  avgRatingOutOfTen: number | null;
  ratedLogCount: number;
  title: string;
  tmdbRatingOutOfTen: number | null;
  tmdbVoteCount: number | null;
};

export const sortArchiveItemsGeneric = <T extends SortableArchiveItem>(
  items: T[],
  sortKind: ArchiveSortKind,
  compareDateDesc: (left: T, right: T) => number,
  compareDateAsc: (left: T, right: T) => number,
  minVotesForConfidence: number,
): T[] => {
  const sortedItems = [...items];

  if (sortKind === "trending") {
    sortedItems.sort((left, right) => {
      if (right.logCount !== left.logCount) {
        return right.logCount - left.logCount;
      }

      const leftRating = left.avgRatingOutOfTen ?? -1;
      const rightRating = right.avgRatingOutOfTen ?? -1;
      if (rightRating !== leftRating) {
        return rightRating - leftRating;
      }

      return compareDateDesc(left, right);
    });

    return sortedItems;
  }

  if (sortKind === "date_desc") {
    sortedItems.sort(compareDateDesc);
    return sortedItems;
  }

  if (sortKind === "date_asc") {
    sortedItems.sort(compareDateAsc);
    return sortedItems;
  }

  if (sortKind === "logs_desc") {
    sortedItems.sort((left, right) => {
      if (right.logCount !== left.logCount) {
        return right.logCount - left.logCount;
      }

      return compareDateDesc(left, right);
    });

    return sortedItems;
  }

  if (sortKind === "rating_user_desc") {
    sortedItems.sort((left, right) => {
      const leftRating = left.avgRatingOutOfTen;
      const rightRating = right.avgRatingOutOfTen;

      if (leftRating === null && rightRating !== null) {
        return 1;
      }

      if (leftRating !== null && rightRating === null) {
        return -1;
      }

      if (leftRating !== null && rightRating !== null && rightRating !== leftRating) {
        return rightRating - leftRating;
      }

      if (right.ratedLogCount !== left.ratedLogCount) {
        return right.ratedLogCount - left.ratedLogCount;
      }

      return compareDateDesc(left, right);
    });

    return sortedItems;
  }

  if (sortKind === "rating_tmdb_desc") {
    return sortByWeightedTmdbRatingDesc(sortedItems, minVotesForConfidence, (left, right) => {
      if (right.logCount !== left.logCount) {
        return right.logCount - left.logCount;
      }

      return compareDateDesc(left, right);
    });
  }

  sortedItems.sort((left, right) => {
    const titleOrder = left.title.localeCompare(right.title);
    if (titleOrder !== 0) {
      return titleOrder;
    }

    return compareDateDesc(left, right);
  });

  return sortedItems;
};
