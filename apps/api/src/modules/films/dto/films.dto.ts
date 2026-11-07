import { z } from "zod";
import {
  DEFAULT_ARCHIVE_LIMIT,
  DEFAULT_ARCHIVE_PAGE,
  MAX_ARCHIVE_PAGE,
  DEFAULT_ARCHIVE_PERIOD,
  DEFAULT_ARCHIVE_SORT,
  DEFAULT_DETAIL_REVIEWS_LIMIT,
  DEFAULT_DETAIL_REVIEWS_PAGE,
  DEFAULT_DETAIL_REVIEWS_SORT,
  MAX_ARCHIVE_LIMIT,
  MAX_DETAIL_REVIEWS_LIMIT,
} from "../../../commons/constants/archive.constants";

const filmArchiveSortValues = [
  "trending",
  "release_desc",
  "release_asc",
  "logs_desc",
  "rating_user_desc",
  "rating_tmdb_desc",
  "title_asc",
] as const;

export type FilmArchiveSort = (typeof filmArchiveSortValues)[number];

const filmArchivePeriodValues = [
  "all_time",
  "this_year",
  "last_10_years",
  "this_week",
  "today",
] as const;

export type FilmArchivePeriod = (typeof filmArchivePeriodValues)[number];

const filmDetailReviewSortValues = ["popular", "recent"] as const;

export type FilmDetailReviewSort = (typeof filmDetailReviewSortValues)[number];

export const SearchFilmsQuerySchema = z.object({
  query: z.string().trim().min(1),
});

export type SearchFilmsQuery = z.input<typeof SearchFilmsQuerySchema>;

export const FilmParamsSchema = z.object({
  tmdbId: z.string(),
});

export type FilmParams = z.input<typeof FilmParamsSchema>;

export const FilmDetailQuerySchema = z.object({
  reviewsSort: z.enum(filmDetailReviewSortValues).optional(),
  reviewsPage: z.coerce.number().int().min(1).optional(),
  reviewsLimit: z.coerce.number().int().min(1).max(MAX_DETAIL_REVIEWS_LIMIT).optional(),
});

export type FilmDetailQuery = z.input<typeof FilmDetailQuerySchema>;

export type NormalizedFilmReviewsQuery = {
  reviewsSort: FilmDetailReviewSort;
  reviewsPage: number;
  reviewsLimit: number;
};

const DEFAULT_LOGS_LIMIT = 50;

// Mirrors SerialLogsQuerySchema/normalizeSerialLogsQuery.
export const FilmLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type FilmLogsQuery = z.input<typeof FilmLogsQuerySchema>;

export const normalizeFilmLogsQuery = (
  input: unknown,
): { limit: number; offset: number } => {
  const parsed = FilmLogsQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { limit: DEFAULT_LOGS_LIMIT, offset: 0 };
  }

  return {
    limit: parsed.data.limit ?? DEFAULT_LOGS_LIMIT,
    offset: parsed.data.offset ?? 0,
  };
};

const optionalTrimmedTextSchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

const optionalArchiveGenreSchema = optionalTrimmedTextSchema.transform((value) => {
  if (!value || value.toLowerCase() === "all") {
    return null;
  }

  return value;
});

const optionalArchiveLanguageSchema = optionalTrimmedTextSchema.transform((value) => {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();
  if (normalized === "all" || normalized === "all-lang") {
    return null;
  }

  if (!/^[a-z]{2,3}$/.test(normalized)) {
    return null;
  }

  return normalized;
});

const archiveSortSchema = optionalTrimmedTextSchema.transform((value): FilmArchiveSort => {
  if (!value) {
    return DEFAULT_ARCHIVE_SORT as FilmArchiveSort;
  }

  if (value === "rating_desc") {
    return "rating_user_desc";
  }

  return (filmArchiveSortValues as readonly string[]).includes(value)
    ? (value as FilmArchiveSort)
    : (DEFAULT_ARCHIVE_SORT as FilmArchiveSort);
});

const archivePeriodSchema = optionalTrimmedTextSchema.transform(
  (value): FilmArchivePeriod => {
    if (!value) {
      return DEFAULT_ARCHIVE_PERIOD as FilmArchivePeriod;
    }

    return (filmArchivePeriodValues as readonly string[]).includes(value)
      ? (value as FilmArchivePeriod)
      : (DEFAULT_ARCHIVE_PERIOD as FilmArchivePeriod);
  },
);

const clampedArchivePageSchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) {
      return DEFAULT_ARCHIVE_PAGE;
    }

    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_ARCHIVE_PAGE;
    }

    return Math.min(MAX_ARCHIVE_PAGE, Math.max(1, parsed));
  });

const clampedArchiveLimitSchema = z
  .string()
  .optional()
  .transform((value) => {
    if (!value) {
      return DEFAULT_ARCHIVE_LIMIT;
    }

    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) {
      return DEFAULT_ARCHIVE_LIMIT;
    }

    return Math.max(1, Math.min(MAX_ARCHIVE_LIMIT, parsed));
  });

export const FilmArchiveQuerySchema = z.object({
  genre: optionalArchiveGenreSchema.optional(),
  language: optionalArchiveLanguageSchema.optional(),
  sort: archiveSortSchema.optional(),
  period: archivePeriodSchema.optional(),
  page: clampedArchivePageSchema.optional(),
  limit: clampedArchiveLimitSchema.optional(),
});

export type FilmArchiveQuery = z.input<typeof FilmArchiveQuerySchema>;

export type NormalizedFilmArchiveQuery = {
  genre: string | null;
  language: string | null;
  sort: FilmArchiveSort;
  period: FilmArchivePeriod;
  page: number;
  limit: number;
};

export const normalizeFilmDetailQuery = (
  input: FilmDetailQuery,
): NormalizedFilmReviewsQuery => {
  const parsed = FilmDetailQuerySchema.safeParse(input);
  const data = parsed.success ? parsed.data : {};

  return {
    reviewsSort: data.reviewsSort ?? (DEFAULT_DETAIL_REVIEWS_SORT as FilmDetailReviewSort),
    reviewsPage: data.reviewsPage ?? DEFAULT_DETAIL_REVIEWS_PAGE,
    reviewsLimit: data.reviewsLimit ?? DEFAULT_DETAIL_REVIEWS_LIMIT,
  };
};

export const normalizeFilmArchiveQuery = (
  input: FilmArchiveQuery,
): NormalizedFilmArchiveQuery => {
  const parsed = FilmArchiveQuerySchema.safeParse(input);
  const data = parsed.success ? parsed.data : {};

  return {
    genre: data.genre ?? null,
    language: data.language ?? null,
    sort: data.sort ?? (DEFAULT_ARCHIVE_SORT as FilmArchiveSort),
    period: data.period ?? (DEFAULT_ARCHIVE_PERIOD as FilmArchivePeriod),
    page: data.page ?? DEFAULT_ARCHIVE_PAGE,
    limit: data.limit ?? DEFAULT_ARCHIVE_LIMIT,
  };
};
