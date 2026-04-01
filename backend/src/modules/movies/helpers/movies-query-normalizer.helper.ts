import {
  cinemaArchivePeriodValues,
  cinemaArchiveSortValues,
  movieDetailReviewSortValues,
  type CinemaArchivePeriod,
  type CinemaArchiveSort,
  type MovieDetailReviewSort,
} from "../dto/movies.dto";
import {
  DEFAULT_ARCHIVE_LIMIT,
  DEFAULT_ARCHIVE_PERIOD,
  DEFAULT_ARCHIVE_PAGE,
  DEFAULT_ARCHIVE_SORT,
  DEFAULT_DETAIL_REVIEWS_SORT,
  MAX_ARCHIVE_LIMIT,
} from "../constants/movies.constants";

const archiveSortSet = new Set<string>(cinemaArchiveSortValues);
const archivePeriodSet = new Set<string>(cinemaArchivePeriodValues);
const detailReviewSortSet = new Set<string>(movieDetailReviewSortValues);

export const normalizeArchiveSort = (
  rawSort: string | undefined,
): CinemaArchiveSort => {
  if (rawSort === "rating_desc") {
    return "rating_user_desc";
  }

  if (rawSort && archiveSortSet.has(rawSort)) {
    return rawSort as CinemaArchiveSort;
  }

  return DEFAULT_ARCHIVE_SORT;
};

export const normalizeArchiveGenre = (
  rawGenre: string | undefined,
): string | null => {
  if (!rawGenre) {
    return null;
  }

  const trimmed = rawGenre.trim();
  if (!trimmed || trimmed.toLowerCase() === "all") {
    return null;
  }

  return trimmed;
};

export const normalizeArchivePeriod = (
  rawPeriod: string | undefined,
): CinemaArchivePeriod => {
  if (rawPeriod && archivePeriodSet.has(rawPeriod)) {
    return rawPeriod as CinemaArchivePeriod;
  }

  return DEFAULT_ARCHIVE_PERIOD as CinemaArchivePeriod;
};

export const normalizeArchiveLanguage = (
  rawLanguage: string | undefined,
): string | null => {
  if (!rawLanguage) {
    return null;
  }

  const normalized = rawLanguage.trim().toLowerCase();
  if (!normalized || normalized === "all" || normalized === "all-lang") {
    return null;
  }

  if (!/^[a-z]{2,3}$/.test(normalized)) {
    return null;
  }

  return normalized;
};

export const normalizeArchivePage = (rawPage: string | undefined): number => {
  if (!rawPage) {
    return DEFAULT_ARCHIVE_PAGE;
  }

  const parsed = Number.parseInt(rawPage, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_ARCHIVE_PAGE;
  }

  return Math.max(1, parsed);
};

export const normalizeArchiveLimit = (rawLimit: string | undefined): number => {
  if (!rawLimit) {
    return DEFAULT_ARCHIVE_LIMIT;
  }

  const parsed = Number.parseInt(rawLimit, 10);
  if (Number.isNaN(parsed)) {
    return DEFAULT_ARCHIVE_LIMIT;
  }

  return Math.max(1, Math.min(MAX_ARCHIVE_LIMIT, parsed));
};

export const normalizeDetailReviewSort = (
  rawSort: string | undefined,
): MovieDetailReviewSort => {
  if (rawSort && detailReviewSortSet.has(rawSort)) {
    return rawSort as MovieDetailReviewSort;
  }

  return DEFAULT_DETAIL_REVIEWS_SORT;
};
