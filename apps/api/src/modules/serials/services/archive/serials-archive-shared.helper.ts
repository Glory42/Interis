import {
  compareByFirstAirAsc,
  compareByFirstAirDesc,
  toFirstAirTimestamp,
} from "../../helpers/serials-format.helper";
import { buildAvailableGenresFromItems } from "../../../media/helpers/media-archive-genres.helper";
import {
  computeArchivePeriodWindow,
  getGenericTmdbMinVoteCountForPeriod,
  isItemInArchivePeriod,
  type ArchivePeriod,
} from "../../../media/helpers/media-archive-period.helper";
import { sortArchiveItemsGeneric, type ArchiveSortKind } from "../../../media/helpers/media-archive-sort.helper";
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

export const getArchivePeriodWindow = (
  period: SerialArchivePeriod,
): SerialsArchivePeriodWindow => {
  const window = computeArchivePeriodWindow(period as ArchivePeriod);

  return {
    firstAirDateGte: window.dateGte,
    firstAirDateLte: window.dateLte,
    startYear: window.startYear,
    endYear: window.endYear,
  };
};

export const isSeriesInArchivePeriod = (
  series: Pick<SerialArchiveItem, "firstAirDate" | "firstAirYear">,
  period: SerialArchivePeriod,
  periodWindow: SerialsArchivePeriodWindow,
): boolean => {
  // Preserves the exact original call - firstAirYear passed as fallback.
  const timestamp = toFirstAirTimestamp(series.firstAirDate, series.firstAirYear);

  return isItemInArchivePeriod(timestamp, series.firstAirYear, period as ArchivePeriod, {
    dateGte: periodWindow.firstAirDateGte,
    dateLte: periodWindow.firstAirDateLte,
    startYear: periodWindow.startYear,
    endYear: periodWindow.endYear,
  });
};

// Higher than the discover-floor constant below: the floor only keeps
// statistical noise (a handful of votes) out of the candidate pool, while
// this constant does the actual re-ranking. TV vote counts on TMDB span a
// much wider range than the floor implies (a handful of hundreds up to
// tens of thousands for genuinely popular shows), so a low confidence
// constant still let shows with a few hundred votes outrank shows with
// 10,000+ votes and a slightly lower average.
const RATING_SORT_MIN_VOTES_FOR_CONFIDENCE = 1500;

const SORT_KIND_BY_SERIAL_SORT: Record<SerialArchiveSort, ArchiveSortKind> = {
  trending: "trending",
  first_air_desc: "date_desc",
  first_air_asc: "date_asc",
  logs_desc: "logs_desc",
  rating_user_desc: "rating_user_desc",
  rating_tmdb_desc: "rating_tmdb_desc",
  title_asc: "title_asc",
};

export const sortArchiveItems = (
  items: SerialArchiveItem[],
  sortBy: SerialArchiveSort,
): SerialArchiveItem[] => {
  return sortArchiveItemsGeneric(
    items,
    SORT_KIND_BY_SERIAL_SORT[sortBy],
    compareByFirstAirDesc,
    compareByFirstAirAsc,
    RATING_SORT_MIN_VOTES_FOR_CONFIDENCE,
  );
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
  return getGenericTmdbMinVoteCountForPeriod(
    period as ArchivePeriod,
    sortBy,
    "rating_tmdb_desc",
    RATING_SORT_MIN_VOTE_COUNT_BY_PERIOD as Record<ArchivePeriod, number>,
  );
};
