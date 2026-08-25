import type { CinemaArchivePeriod, CinemaArchiveSort } from "../../dto/movies.dto";
import {
  compareByReleaseAsc,
  compareByReleaseDesc,
  toReleaseTimestamp,
} from "../../helpers/movies-format.helper";
import { buildAvailableGenresFromItems } from "../../../media/helpers/media-archive-genres.helper";
import {
  computeArchivePeriodWindow,
  getGenericTmdbMinVoteCountForPeriod,
  isItemInArchivePeriod,
  type ArchivePeriod,
} from "../../../media/helpers/media-archive-period.helper";
import { sortArchiveItemsGeneric, type ArchiveSortKind } from "../../../media/helpers/media-archive-sort.helper";
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

export const getArchivePeriodWindow = (
  period: CinemaArchivePeriod,
): MoviesArchivePeriodWindow => {
  const window = computeArchivePeriodWindow(period as ArchivePeriod);

  return {
    releaseDateGte: window.dateGte,
    releaseDateLte: window.dateLte,
    startYear: window.startYear,
    endYear: window.endYear,
  };
};

// The floor for "Highest rated (TMDB)" is much higher than for other sorts:
// TMDB's discover API only offers a raw vote_average.desc sort with a
// vote_count.gte floor (no weighted/Bayesian sort of its own), so a low
// floor lets a title with e.g. 10 votes that are all a perfect 10 outrank
// widely-watched titles with a slightly lower but far more reliable
// average. Recent-period windows use a lower floor since new releases
// haven't accumulated many votes yet.
const RATING_SORT_MIN_VOTE_COUNT_BY_PERIOD: Record<CinemaArchivePeriod, number> = {
  today: 10,
  this_week: 20,
  this_year: 50,
  last_10_years: 300,
  all_time: 300,
};

export const getTmdbMinVoteCountForPeriod = (
  period: CinemaArchivePeriod,
  sortBy: CinemaArchiveSort,
): number => {
  return getGenericTmdbMinVoteCountForPeriod(
    period as ArchivePeriod,
    sortBy,
    "rating_tmdb_desc",
    RATING_SORT_MIN_VOTE_COUNT_BY_PERIOD as Record<ArchivePeriod, number>,
  );
};

// Same confidence threshold as the TMDB-catalog floor above, applied as a
// Bayesian weighted rating instead of a hard cutoff for locally-sorted
// items (where we already have every candidate's vote count in memory).
const RATING_SORT_MIN_VOTES_FOR_CONFIDENCE = 300;

export const isActivityWindowPeriod = (period: CinemaArchivePeriod): boolean => {
  return period === "this_week" || period === "today";
};

export const isMovieInArchivePeriod = (
  movie: Pick<CinemaArchiveItem, "releaseDate" | "releaseYear">,
  period: CinemaArchivePeriod,
  periodWindow: MoviesArchivePeriodWindow,
): boolean => {
  // Preserves the exact original call - no release-year fallback passed here.
  const timestamp = toReleaseTimestamp(movie.releaseDate, null);

  return isItemInArchivePeriod(timestamp, movie.releaseYear, period as ArchivePeriod, {
    dateGte: periodWindow.releaseDateGte,
    dateLte: periodWindow.releaseDateLte,
    startYear: periodWindow.startYear,
    endYear: periodWindow.endYear,
  });
};

const SORT_KIND_BY_CINEMA_SORT: Record<CinemaArchiveSort, ArchiveSortKind> = {
  trending: "trending",
  release_desc: "date_desc",
  release_asc: "date_asc",
  logs_desc: "logs_desc",
  rating_user_desc: "rating_user_desc",
  rating_tmdb_desc: "rating_tmdb_desc",
  title_asc: "title_asc",
};

export const sortLocalArchiveItems = (
  items: CinemaArchiveItem[],
  sortBy: CinemaArchiveSort,
): CinemaArchiveItem[] => {
  return sortArchiveItemsGeneric(
    items,
    SORT_KIND_BY_CINEMA_SORT[sortBy],
    compareByReleaseDesc,
    compareByReleaseAsc,
    RATING_SORT_MIN_VOTES_FOR_CONFIDENCE,
  );
};
