import { z } from "zod";
import {
  DEFAULT_ARCHIVE_LIMIT,
  DEFAULT_ARCHIVE_PAGE,
  DEFAULT_ARCHIVE_PERIOD,
  DEFAULT_ARCHIVE_SORT,
  DEFAULT_DETAIL_REVIEWS_LIMIT,
  DEFAULT_DETAIL_REVIEWS_PAGE,
  DEFAULT_DETAIL_REVIEWS_SORT,
  MAX_ARCHIVE_LIMIT,
  MAX_DETAIL_REVIEWS_LIMIT,
} from "../../../commons/constants/archive.constants";

const movieArchiveSortValues = [
  "trending",
  "release_desc",
  "release_asc",
  "logs_desc",
  "rating_user_desc",
  "rating_tmdb_desc",
  "title_asc",
] as const;

export type MovieArchiveSort = (typeof movieArchiveSortValues)[number];

const movieArchivePeriodValues = [
  "all_time",
  "this_year",
  "last_10_years",
  "this_week",
  "today",
] as const;

export type MovieArchivePeriod = (typeof movieArchivePeriodValues)[number];

const movieDetailReviewSortValues = ["popular", "recent"] as const;

export type MovieDetailReviewSort = (typeof movieDetailReviewSortValues)[number];

export const SearchMoviesQuerySchema = z.object({
  query: z.string().trim().min(1),
});

export type SearchMoviesQuery = z.input<typeof SearchMoviesQuerySchema>;

export const MovieParamsSchema = z.object({
  tmdbId: z.string(),
});

export type MovieParams = z.input<typeof MovieParamsSchema>;

export const MovieDetailQuerySchema = z.object({
  reviewsSort: z.enum(movieDetailReviewSortValues).optional(),
  reviewsPage: z.coerce.number().int().min(1).optional(),
  reviewsLimit: z.coerce.number().int().min(1).max(MAX_DETAIL_REVIEWS_LIMIT).optional(),
});

export type MovieDetailQuery = z.input<typeof MovieDetailQuerySchema>;

export type NormalizedMovieReviewsQuery = {
  reviewsSort: MovieDetailReviewSort;
  reviewsPage: number;
  reviewsLimit: number;
};

const DEFAULT_LOGS_LIMIT = 50;

// Mirrors SerialLogsQuerySchema/normalizeSerialLogsQuery.
export const MovieLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type MovieLogsQuery = z.input<typeof MovieLogsQuerySchema>;

export const normalizeMovieLogsQuery = (
  input: unknown,
): { limit: number; offset: number } => {
  const parsed = MovieLogsQuerySchema.safeParse(input);
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

const archiveSortSchema = optionalTrimmedTextSchema.transform((value): MovieArchiveSort => {
  if (!value) {
    return DEFAULT_ARCHIVE_SORT as MovieArchiveSort;
  }

  if (value === "rating_desc") {
    return "rating_user_desc";
  }

  return (movieArchiveSortValues as readonly string[]).includes(value)
    ? (value as MovieArchiveSort)
    : (DEFAULT_ARCHIVE_SORT as MovieArchiveSort);
});

const archivePeriodSchema = optionalTrimmedTextSchema.transform(
  (value): MovieArchivePeriod => {
    if (!value) {
      return DEFAULT_ARCHIVE_PERIOD as MovieArchivePeriod;
    }

    return (movieArchivePeriodValues as readonly string[]).includes(value)
      ? (value as MovieArchivePeriod)
      : (DEFAULT_ARCHIVE_PERIOD as MovieArchivePeriod);
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

    return Math.max(1, parsed);
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

export const MovieArchiveQuerySchema = z.object({
  genre: optionalArchiveGenreSchema.optional(),
  language: optionalArchiveLanguageSchema.optional(),
  sort: archiveSortSchema.optional(),
  period: archivePeriodSchema.optional(),
  page: clampedArchivePageSchema.optional(),
  limit: clampedArchiveLimitSchema.optional(),
});

export type MovieArchiveQuery = z.input<typeof MovieArchiveQuerySchema>;

export type NormalizedMovieArchiveQuery = {
  genre: string | null;
  language: string | null;
  sort: MovieArchiveSort;
  period: MovieArchivePeriod;
  page: number;
  limit: number;
};

export const normalizeMovieDetailQuery = (
  input: MovieDetailQuery,
): NormalizedMovieReviewsQuery => {
  const parsed = MovieDetailQuerySchema.safeParse(input);
  const data = parsed.success ? parsed.data : {};

  return {
    reviewsSort: data.reviewsSort ?? (DEFAULT_DETAIL_REVIEWS_SORT as MovieDetailReviewSort),
    reviewsPage: data.reviewsPage ?? DEFAULT_DETAIL_REVIEWS_PAGE,
    reviewsLimit: data.reviewsLimit ?? DEFAULT_DETAIL_REVIEWS_LIMIT,
  };
};

export const normalizeMovieArchiveQuery = (
  input: MovieArchiveQuery,
): NormalizedMovieArchiveQuery => {
  const parsed = MovieArchiveQuerySchema.safeParse(input);
  const data = parsed.success ? parsed.data : {};

  return {
    genre: data.genre ?? null,
    language: data.language ?? null,
    sort: data.sort ?? (DEFAULT_ARCHIVE_SORT as MovieArchiveSort),
    period: data.period ?? (DEFAULT_ARCHIVE_PERIOD as MovieArchivePeriod),
    page: data.page ?? DEFAULT_ARCHIVE_PAGE,
    limit: data.limit ?? DEFAULT_ARCHIVE_LIMIT,
  };
};
