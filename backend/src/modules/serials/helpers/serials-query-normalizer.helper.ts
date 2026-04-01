import {
  serialDetailReviewSortValues,
  serialArchivePeriodValues,
  serialArchiveSortValues,
  type SerialDetailReviewSort,
  type SerialArchivePeriod,
  type SerialArchiveSort,
} from "../dto/serials.dto";
import {
  DEFAULT_ARCHIVE_LIMIT,
  DEFAULT_ARCHIVE_PAGE,
  DEFAULT_ARCHIVE_PERIOD,
  DEFAULT_ARCHIVE_SORT,
  DEFAULT_DETAIL_REVIEWS_SORT,
  MAX_ARCHIVE_LIMIT,
} from "../constants/serials.constants";

const archiveSortSet = new Set<string>(serialArchiveSortValues);
const archivePeriodSet = new Set<string>(serialArchivePeriodValues);
const detailReviewSortSet = new Set<string>(serialDetailReviewSortValues);

export const normalizeArchiveSort = (
  rawSort: string | undefined,
): SerialArchiveSort => {
  if (rawSort && archiveSortSet.has(rawSort)) {
    return rawSort as SerialArchiveSort;
  }

  return DEFAULT_ARCHIVE_SORT as SerialArchiveSort;
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
): SerialArchivePeriod => {
  if (rawPeriod && archivePeriodSet.has(rawPeriod)) {
    return rawPeriod as SerialArchivePeriod;
  }

  return DEFAULT_ARCHIVE_PERIOD as SerialArchivePeriod;
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
): SerialDetailReviewSort => {
  if (rawSort && detailReviewSortSet.has(rawSort)) {
    return rawSort as SerialDetailReviewSort;
  }

  return DEFAULT_DETAIL_REVIEWS_SORT;
};
