import type { CinemaArchivePeriod, CinemaArchiveSort } from "../../dto/movies.dto";
import {
  compareByReleaseAsc,
  compareByReleaseDesc,
  toReleaseTimestamp,
} from "../../helpers/movies-format.helper";
import { buildAvailableGenresFromItems } from "../../../media/helpers/media-archive-genres.helper";
import type {
  ArchiveGenreOption,
  CinemaArchiveItem,
} from "../../types/movies.types";
import type { MoviesArchivePeriodWindow } from "./movies-archive.types";

export const toAvailableGenresFromItems = (
  items: CinemaArchiveItem[],
): ArchiveGenreOption[] => {
  return buildAvailableGenresFromItems(items) as ArchiveGenreOption[];
};

const toIsoDateUtc = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

export const getArchivePeriodWindow = (
  period: CinemaArchivePeriod,
): MoviesArchivePeriodWindow => {
  if (period === "all_time") {
    return {
      releaseDateGte: null,
      releaseDateLte: null,
      startYear: null,
      endYear: null,
    };
  }

  const now = new Date();
  const nowYear = now.getUTCFullYear();
  const todayIsoDate = toIsoDateUtc(now);

  if (period === "today") {
    return {
      releaseDateGte: todayIsoDate,
      releaseDateLte: todayIsoDate,
      startYear: nowYear,
      endYear: nowYear,
    };
  }

  if (period === "this_week") {
    const daysSinceSunday = now.getUTCDay();
    const weekStartDate = new Date(
      Date.UTC(nowYear, now.getUTCMonth(), now.getUTCDate() - daysSinceSunday),
    );

    return {
      releaseDateGte: toIsoDateUtc(weekStartDate),
      releaseDateLte: todayIsoDate,
      startYear: weekStartDate.getUTCFullYear(),
      endYear: nowYear,
    };
  }

  if (period === "this_year") {
    return {
      releaseDateGte: `${nowYear}-01-01`,
      releaseDateLte: todayIsoDate,
      startYear: nowYear,
      endYear: nowYear,
    };
  }

  const startYear = nowYear - 9;

  return {
    releaseDateGte: `${startYear}-01-01`,
    releaseDateLte: todayIsoDate,
    startYear,
    endYear: nowYear,
  };
};

export const getTmdbMinVoteCountForPeriod = (period: CinemaArchivePeriod): number => {
  if (period === "this_week" || period === "today") {
    return 0;
  }

  return 15;
};

export const isActivityWindowPeriod = (period: CinemaArchivePeriod): boolean => {
  return period === "this_week" || period === "today";
};

export const isMovieInArchivePeriod = (
  movie: Pick<CinemaArchiveItem, "releaseDate" | "releaseYear">,
  period: CinemaArchivePeriod,
  periodWindow: MoviesArchivePeriodWindow,
): boolean => {
  if (period === "all_time") {
    return true;
  }

  const releaseDateMs = toReleaseTimestamp(movie.releaseDate, null);
  if (releaseDateMs !== Number.NEGATIVE_INFINITY) {
    const startDateMs = periodWindow.releaseDateGte
      ? Date.parse(periodWindow.releaseDateGte)
      : Number.NEGATIVE_INFINITY;
    const endDateMs = periodWindow.releaseDateLte
      ? Date.parse(periodWindow.releaseDateLte)
      : Number.POSITIVE_INFINITY;

    return releaseDateMs >= startDateMs && releaseDateMs <= endDateMs;
  }

  if (movie.releaseYear === null) {
    return false;
  }

  if (period === "today" || period === "this_week") {
    return false;
  }

  const startYear = periodWindow.startYear ?? Number.NEGATIVE_INFINITY;
  const endYear = periodWindow.endYear ?? Number.POSITIVE_INFINITY;

  return movie.releaseYear >= startYear && movie.releaseYear <= endYear;
};

export const sortLocalArchiveItems = (
  items: CinemaArchiveItem[],
  sortBy: CinemaArchiveSort,
): CinemaArchiveItem[] => {
  const sortedItems = [...items];

  if (sortBy === "trending") {
    sortedItems.sort((left, right) => {
      if (right.logCount !== left.logCount) {
        return right.logCount - left.logCount;
      }

      const leftRating = left.avgRatingOutOfTen ?? -1;
      const rightRating = right.avgRatingOutOfTen ?? -1;
      if (rightRating !== leftRating) {
        return rightRating - leftRating;
      }

      return compareByReleaseDesc(left, right);
    });

    return sortedItems;
  }

  if (sortBy === "release_desc") {
    sortedItems.sort(compareByReleaseDesc);
    return sortedItems;
  }

  if (sortBy === "release_asc") {
    sortedItems.sort(compareByReleaseAsc);
    return sortedItems;
  }

  if (sortBy === "logs_desc") {
    sortedItems.sort((left, right) => {
      if (right.logCount !== left.logCount) {
        return right.logCount - left.logCount;
      }

      return compareByReleaseDesc(left, right);
    });

    return sortedItems;
  }

  if (sortBy === "rating_user_desc") {
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

      return compareByReleaseDesc(left, right);
    });

    return sortedItems;
  }

  if (sortBy === "rating_tmdb_desc") {
    sortedItems.sort((left, right) => {
      const leftRating = left.tmdbRatingOutOfTen;
      const rightRating = right.tmdbRatingOutOfTen;

      if (leftRating === null && rightRating !== null) {
        return 1;
      }

      if (leftRating !== null && rightRating === null) {
        return -1;
      }

      if (leftRating !== null && rightRating !== null && rightRating !== leftRating) {
        return rightRating - leftRating;
      }

      if (right.logCount !== left.logCount) {
        return right.logCount - left.logCount;
      }

      return compareByReleaseDesc(left, right);
    });

    return sortedItems;
  }

  sortedItems.sort((left, right) => {
    const titleOrder = left.title.localeCompare(right.title);
    if (titleOrder !== 0) {
      return titleOrder;
    }

    return compareByReleaseDesc(left, right);
  });

  return sortedItems;
};
