import {
  compareByFirstAirAsc,
  compareByFirstAirDesc,
  toFirstAirTimestamp,
} from "../../helpers/tv-format.helper";
import { buildAvailableGenresFromItems } from "../../../media/helpers/media-archive-genres.helper";
import {
  computeArchivePeriodWindow,
  getGenericTmdbMinVoteCountForPeriod,
  isItemInArchivePeriod,
  type ArchivePeriod,
} from "../../../media/helpers/media-archive-period.helper";
import { sortArchiveItemsGeneric, type ArchiveSortKind } from "../../../media/helpers/media-archive-sort.helper";
import { TvInteractionsRepository } from "../../repositories/tv-interactions.repository";
import { TvEpisodeInteractionsRepository } from "../../repositories/tv-episode-interactions.repository";
import type { SeriesArchivePeriod, SeriesArchiveSort } from "../../dto/tv.dto";
import type {
  SeriesArchiveGenreOption,
  SeriesArchiveItem,
} from "../../types/tv.types";
import type { TvArchivePeriodWindow } from "./tv-archive.types";

// "Watched" vs "Watching" (as opposed to just "has logged it") needs actual
// episode progress, not just diary/rating existence - a series can have a
// diary entry from years ago while the viewer is still partway through a
// newer season. Shared by both the local-cache and TMDB-backed archive
// services so the two grid sources can't drift out of sync on this.
export const addViewerArchiveState = async (
  viewerUserId: string | null,
  pageItems: SeriesArchiveItem[],
): Promise<SeriesArchiveItem[]> => {
  if (!viewerUserId || pageItems.length === 0) {
    return pageItems;
  }

  const tmdbIds = pageItems.map((item) => item.tmdbId);
  const [viewerDiaryLoggedTmdbIds, viewerInteractionRows, viewerEpisodeCounts] =
    await Promise.all([
      TvInteractionsRepository.getViewerDiaryLoggedTmdbIds(viewerUserId, tmdbIds),
      TvInteractionsRepository.getViewerSeriesInteractionStateByTmdbIds(
        viewerUserId,
        tmdbIds,
      ),
      TvEpisodeInteractionsRepository.getViewerWatchedEpisodeCountsByTmdbIds(
        viewerUserId,
        tmdbIds,
      ),
    ]);

  const viewerLoggedTmdbIdSet = new Set<number>(viewerDiaryLoggedTmdbIds);
  const viewerWatchlistedTmdbIdSet = new Set<number>();
  const viewerFullyWatchedTmdbIdSet = new Set<number>();

  for (const row of viewerInteractionRows) {
    if (row.watchlisted) viewerWatchlistedTmdbIdSet.add(row.tmdbId);
    if (row.watchStatus === "completed") viewerFullyWatchedTmdbIdSet.add(row.tmdbId);
    if (row.rating !== null) viewerLoggedTmdbIdSet.add(row.tmdbId);
  }

  const viewerWatchedEpisodesCountByTmdbId = new Map<number, number>(
    viewerEpisodeCounts.map((row) => [row.tmdbId, row.watchedEpisodesCount]),
  );

  return pageItems.map((item) => {
    const watchedEpisodesCount = viewerWatchedEpisodesCountByTmdbId.get(item.tmdbId) ?? 0;

    return {
      ...item,
      viewerHasLogged: viewerLoggedTmdbIdSet.has(item.tmdbId),
      viewerWatchlisted: viewerWatchlistedTmdbIdSet.has(item.tmdbId),
      viewerFullyWatched: viewerFullyWatchedTmdbIdSet.has(item.tmdbId),
      viewerHasProgress: watchedEpisodesCount > 0,
    };
  });
};

export const toAvailableGenresFromItems = (
  items: SeriesArchiveItem[],
): SeriesArchiveGenreOption[] => {
  return buildAvailableGenresFromItems(items) as SeriesArchiveGenreOption[];
};

export const getArchivePeriodWindow = (
  period: SeriesArchivePeriod,
): TvArchivePeriodWindow => {
  const window = computeArchivePeriodWindow(period as ArchivePeriod);

  return {
    firstAirDateGte: window.dateGte,
    firstAirDateLte: window.dateLte,
    startYear: window.startYear,
    endYear: window.endYear,
  };
};

export const isSeriesInArchivePeriod = (
  series: Pick<SeriesArchiveItem, "firstAirDate" | "firstAirYear">,
  period: SeriesArchivePeriod,
  periodWindow: TvArchivePeriodWindow,
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

const SORT_KIND_BY_SERIES_SORT: Record<SeriesArchiveSort, ArchiveSortKind> = {
  trending: "trending",
  first_air_desc: "date_desc",
  first_air_asc: "date_asc",
  logs_desc: "logs_desc",
  rating_user_desc: "rating_user_desc",
  rating_tmdb_desc: "rating_tmdb_desc",
  title_asc: "title_asc",
};

export const sortArchiveItems = (
  items: SeriesArchiveItem[],
  sortBy: SeriesArchiveSort,
): SeriesArchiveItem[] => {
  return sortArchiveItemsGeneric(
    items,
    SORT_KIND_BY_SERIES_SORT[sortBy],
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
const RATING_SORT_MIN_VOTE_COUNT_BY_PERIOD: Record<SeriesArchivePeriod, number> = {
  today: 5,
  this_week: 10,
  this_year: 25,
  last_10_years: 100,
  all_time: 100,
};

export const getTmdbMinVoteCountForPeriod = (
  period: SeriesArchivePeriod,
  sortBy: SeriesArchiveSort,
): number => {
  return getGenericTmdbMinVoteCountForPeriod(
    period as ArchivePeriod,
    sortBy,
    "rating_tmdb_desc",
    RATING_SORT_MIN_VOTE_COUNT_BY_PERIOD as Record<ArchivePeriod, number>,
  );
};
