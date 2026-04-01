import {
  compareByFirstAirAsc,
  compareByFirstAirDesc,
  toFirstAirTimestamp,
} from "../../helpers/serials-format.helper";
import type { SerialArchivePeriod, SerialArchiveSort } from "../../dto/serials.dto";
import type {
  SerialArchiveGenreOption,
  SerialArchiveItem,
} from "../../types/serials.types";
import type { SerialsArchivePeriodWindow } from "./serials-archive.types";

export const toAvailableGenresFromItems = (
  items: SerialArchiveItem[],
): SerialArchiveGenreOption[] => {
  const availableGenreMap = new Map<string, SerialArchiveGenreOption>();

  for (const item of items) {
    const seenInItem = new Set<string>();

    for (const genre of item.genres) {
      const normalizedName = genre.name.trim();
      if (!normalizedName) {
        continue;
      }

      const genreKey = normalizedName.toLowerCase();
      if (seenInItem.has(genreKey)) {
        continue;
      }

      seenInItem.add(genreKey);

      const existingGenre = availableGenreMap.get(genreKey);
      if (existingGenre) {
        existingGenre.count = (existingGenre.count ?? 0) + 1;
        continue;
      }

      availableGenreMap.set(genreKey, {
        id: genre.id,
        name: normalizedName,
        count: 1,
      });
    }
  }

  return [...availableGenreMap.values()].sort((leftGenre, rightGenre) =>
    leftGenre.name.localeCompare(rightGenre.name),
  );
};

const toIsoDateUtc = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

export const getArchivePeriodWindow = (
  period: SerialArchivePeriod,
): SerialsArchivePeriodWindow => {
  if (period === "all_time") {
    return {
      firstAirDateGte: null,
      firstAirDateLte: null,
      startYear: null,
      endYear: null,
    };
  }

  const now = new Date();
  const nowYear = now.getUTCFullYear();
  const todayIsoDate = toIsoDateUtc(now);

  if (period === "today") {
    return {
      firstAirDateGte: todayIsoDate,
      firstAirDateLte: todayIsoDate,
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
      firstAirDateGte: toIsoDateUtc(weekStartDate),
      firstAirDateLte: todayIsoDate,
      startYear: weekStartDate.getUTCFullYear(),
      endYear: nowYear,
    };
  }

  if (period === "this_year") {
    return {
      firstAirDateGte: `${nowYear}-01-01`,
      firstAirDateLte: todayIsoDate,
      startYear: nowYear,
      endYear: nowYear,
    };
  }

  const startYear = nowYear - 9;
  return {
    firstAirDateGte: `${startYear}-01-01`,
    firstAirDateLte: todayIsoDate,
    startYear,
    endYear: nowYear,
  };
};

export const isSeriesInArchivePeriod = (
  series: Pick<SerialArchiveItem, "firstAirDate" | "firstAirYear">,
  period: SerialArchivePeriod,
  periodWindow: SerialsArchivePeriodWindow,
): boolean => {
  if (period === "all_time") {
    return true;
  }

  const firstAirTimestamp = toFirstAirTimestamp(series.firstAirDate, series.firstAirYear);

  if (firstAirTimestamp !== Number.NEGATIVE_INFINITY) {
    const startDateTimestamp = periodWindow.firstAirDateGte
      ? Date.parse(periodWindow.firstAirDateGte)
      : Number.NEGATIVE_INFINITY;
    const endDateTimestamp = periodWindow.firstAirDateLte
      ? Date.parse(periodWindow.firstAirDateLte)
      : Number.POSITIVE_INFINITY;

    return (
      firstAirTimestamp >= startDateTimestamp &&
      firstAirTimestamp <= endDateTimestamp
    );
  }

  if (series.firstAirYear === null) {
    return false;
  }

  if (period === "today" || period === "this_week") {
    return false;
  }

  const startYear = periodWindow.startYear ?? Number.NEGATIVE_INFINITY;
  const endYear = periodWindow.endYear ?? Number.POSITIVE_INFINITY;

  return series.firstAirYear >= startYear && series.firstAirYear <= endYear;
};

export const sortArchiveItems = (
  items: SerialArchiveItem[],
  sortBy: SerialArchiveSort,
): SerialArchiveItem[] => {
  const sortedItems = [...items];

  if (sortBy === "first_air_desc" || sortBy === "trending") {
    sortedItems.sort(compareByFirstAirDesc);
    return sortedItems;
  }

  if (sortBy === "first_air_asc") {
    sortedItems.sort(compareByFirstAirAsc);
    return sortedItems;
  }

  if (sortBy === "logs_desc") {
    sortedItems.sort((leftSeries, rightSeries) => {
      if (rightSeries.logCount !== leftSeries.logCount) {
        return rightSeries.logCount - leftSeries.logCount;
      }

      return compareByFirstAirDesc(leftSeries, rightSeries);
    });

    return sortedItems;
  }

  if (sortBy === "rating_user_desc") {
    sortedItems.sort((leftSeries, rightSeries) => {
      const leftRating = leftSeries.avgRatingOutOfTen;
      const rightRating = rightSeries.avgRatingOutOfTen;

      if (leftRating === null && rightRating !== null) {
        return 1;
      }

      if (leftRating !== null && rightRating === null) {
        return -1;
      }

      if (leftRating !== null && rightRating !== null && rightRating !== leftRating) {
        return rightRating - leftRating;
      }

      if (rightSeries.ratedLogCount !== leftSeries.ratedLogCount) {
        return rightSeries.ratedLogCount - leftSeries.ratedLogCount;
      }

      return compareByFirstAirDesc(leftSeries, rightSeries);
    });

    return sortedItems;
  }

  if (sortBy === "rating_tmdb_desc") {
    sortedItems.sort((leftSeries, rightSeries) => {
      const leftRating = leftSeries.tmdbRatingOutOfTen;
      const rightRating = rightSeries.tmdbRatingOutOfTen;

      if (leftRating === null && rightRating !== null) {
        return 1;
      }

      if (leftRating !== null && rightRating === null) {
        return -1;
      }

      if (leftRating !== null && rightRating !== null && rightRating !== leftRating) {
        return rightRating - leftRating;
      }

      return compareByFirstAirDesc(leftSeries, rightSeries);
    });

    return sortedItems;
  }

  sortedItems.sort((leftSeries, rightSeries) => {
    const titleOrder = leftSeries.title.localeCompare(rightSeries.title);
    if (titleOrder !== 0) {
      return titleOrder;
    }

    return compareByFirstAirDesc(leftSeries, rightSeries);
  });

  return sortedItems;
};

export const getTmdbMinVoteCountForPeriod = (period: SerialArchivePeriod): number => {
  if (period === "this_week" || period === "today") {
    return 0;
  }

  return 15;
};
