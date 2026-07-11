import {
  compareByFirstAirAsc,
  compareByFirstAirDesc,
  toFirstAirTimestamp,
} from "../../helpers/serials-format.helper";
import { buildAvailableGenresFromItems } from "../../../media/helpers/media-archive-genres.helper";
import { sortByWeightedTmdbRatingDesc } from "../../../media/helpers/media-weighted-rating.helper";
import { SerialsInteractionsRepository } from "../../repositories/serials-interactions.repository";
import { SerialsEpisodeInteractionsRepository } from "../../repositories/serials-episode-interactions.repository";
import type { SerialArchivePeriod, SerialArchiveSort } from "../../dto/serials.dto";
import type {
  SerialArchiveGenreOption,
  SerialArchiveItem,
} from "../../types/serials.types";
import type { SerialsArchivePeriodWindow } from "./serials-archive.types";

// "Watched" vs "Watching" (as opposed to just "has logged it") needs actual
// episode progress, not just diary/rating existence - a series can have a
// diary entry from years ago while the viewer is still partway through a
// newer season. Shared by both the local-cache and TMDB-backed archive
// services so the two grid sources can't drift out of sync on this.
export const addViewerArchiveState = async (
  viewerUserId: string | null,
  pageItems: SerialArchiveItem[],
): Promise<SerialArchiveItem[]> => {
  if (!viewerUserId || pageItems.length === 0) {
    return pageItems;
  }

  const tmdbIds = pageItems.map((item) => item.tmdbId);
  const [viewerDiaryLoggedTmdbIds, viewerInteractionRows, viewerEpisodeCounts] =
    await Promise.all([
      SerialsInteractionsRepository.getViewerDiaryLoggedTmdbIds(viewerUserId, tmdbIds),
      SerialsInteractionsRepository.getViewerSeriesInteractionStateByTmdbIds(
        viewerUserId,
        tmdbIds,
      ),
      SerialsEpisodeInteractionsRepository.getViewerWatchedEpisodeCountsByTmdbIds(
        viewerUserId,
        tmdbIds,
      ),
    ]);

  const viewerLoggedTmdbIdSet = new Set<number>(viewerDiaryLoggedTmdbIds);
  const viewerWatchlistedTmdbIdSet = new Set<number>();
  const viewerFullyWatchedTmdbIdSet = new Set<number>();

  for (const row of viewerInteractionRows) {
    if (row.watchlisted) viewerWatchlistedTmdbIdSet.add(row.tmdbId);
    if (row.isWatched) viewerFullyWatchedTmdbIdSet.add(row.tmdbId);
    if (row.rating !== null) viewerLoggedTmdbIdSet.add(row.tmdbId);
  }

  const viewerWatchedEpisodesCountByTmdbId = new Map<number, number>(
    viewerEpisodeCounts.map((row) => [row.tmdbId, row.watchedEpisodesCount]),
  );

  return pageItems.map((item) => {
    const watchedEpisodesCount = viewerWatchedEpisodesCountByTmdbId.get(item.tmdbId) ?? 0;
    const viewerFullyWatched =
      viewerFullyWatchedTmdbIdSet.has(item.tmdbId) ||
      (item.numberOfEpisodes !== null &&
        item.numberOfEpisodes > 0 &&
        watchedEpisodesCount === item.numberOfEpisodes);

    return {
      ...item,
      viewerHasLogged: viewerLoggedTmdbIdSet.has(item.tmdbId),
      viewerWatchlisted: viewerWatchlistedTmdbIdSet.has(item.tmdbId),
      viewerFullyWatched,
      viewerHasProgress: watchedEpisodesCount > 0,
    };
  });
};

export const toAvailableGenresFromItems = (
  items: SerialArchiveItem[],
): SerialArchiveGenreOption[] => {
  return buildAvailableGenresFromItems(items) as SerialArchiveGenreOption[];
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

// Higher than the discover-floor constant below: the floor only keeps
// statistical noise (a handful of votes) out of the candidate pool, while
// this constant does the actual re-ranking. TV vote counts on TMDB span a
// much wider range than the floor implies (a handful of hundreds up to
// tens of thousands for genuinely popular shows), so a low confidence
// constant still let shows with a few hundred votes outrank shows with
// 10,000+ votes and a slightly lower average.
const RATING_SORT_MIN_VOTES_FOR_CONFIDENCE = 1500;

export const sortArchiveItems = (
  items: SerialArchiveItem[],
  sortBy: SerialArchiveSort,
): SerialArchiveItem[] => {
  const sortedItems = [...items];

  if (sortBy === "trending") {
    sortedItems.sort((leftSeries, rightSeries) => {
      if (rightSeries.logCount !== leftSeries.logCount) {
        return rightSeries.logCount - leftSeries.logCount;
      }

      const leftRating = leftSeries.avgRatingOutOfTen ?? -1;
      const rightRating = rightSeries.avgRatingOutOfTen ?? -1;
      if (rightRating !== leftRating) {
        return rightRating - leftRating;
      }

      return compareByFirstAirDesc(leftSeries, rightSeries);
    });

    return sortedItems;
  }

  if (sortBy === "first_air_desc") {
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
    return sortByWeightedTmdbRatingDesc(
      sortedItems,
      RATING_SORT_MIN_VOTES_FOR_CONFIDENCE,
      (leftSeries, rightSeries) => {
        if (rightSeries.logCount !== leftSeries.logCount) {
          return rightSeries.logCount - leftSeries.logCount;
        }

        return compareByFirstAirDesc(leftSeries, rightSeries);
      },
    );
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

// TV shows accumulate far fewer TMDB votes than movies, so the confidence
// floor is lower than the movies equivalent, but the same rationale
// applies: raw vote_average.desc lets a series with a handful of votes
// (all rated 10) outrank a widely-watched series with a lower but far
// more reliable average.
const RATING_SORT_MIN_VOTE_COUNT_BY_PERIOD: Record<SerialArchivePeriod, number> = {
  today: 5,
  this_week: 10,
  this_year: 25,
  last_10_years: 100,
  all_time: 100,
};

export const getTmdbMinVoteCountForPeriod = (
  period: SerialArchivePeriod,
  sortBy: SerialArchiveSort,
): number => {
  if (sortBy === "rating_tmdb_desc") {
    return RATING_SORT_MIN_VOTE_COUNT_BY_PERIOD[period];
  }

  if (period === "this_week" || period === "today") {
    return 0;
  }

  return 15;
};
