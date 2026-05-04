import { z } from "zod";
import {
  DEFAULT_ARCHIVE_LIMIT,
  DEFAULT_ARCHIVE_PAGE,
  DEFAULT_ARCHIVE_PERIOD,
  DEFAULT_ARCHIVE_SORT,
  DEFAULT_DETAIL_REVIEWS_SORT,
  MAX_ARCHIVE_LIMIT,
} from "../constants/movies.constants";

export const cinemaArchiveSortValues = [
  "trending",
  "release_desc",
  "release_asc",
  "logs_desc",
  "rating_user_desc",
  "rating_tmdb_desc",
  "title_asc",
] as const;

export type CinemaArchiveSort = (typeof cinemaArchiveSortValues)[number];

export const cinemaArchivePeriodValues = [
  "all_time",
  "this_year",
  "last_10_years",
  "this_week",
  "today",
] as const;

export type CinemaArchivePeriod = (typeof cinemaArchivePeriodValues)[number];

export const movieDetailReviewSortValues = ["popular", "recent"] as const;

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
});

export type MovieDetailQuery = z.input<typeof MovieDetailQuerySchema>;

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

const archiveSortSchema = optionalTrimmedTextSchema.transform((value): CinemaArchiveSort => {
  if (!value) {
    return DEFAULT_ARCHIVE_SORT as CinemaArchiveSort;
  }

  if (value === "rating_desc") {
    return "rating_user_desc";
  }

  return (cinemaArchiveSortValues as readonly string[]).includes(value)
    ? (value as CinemaArchiveSort)
    : (DEFAULT_ARCHIVE_SORT as CinemaArchiveSort);
});

const archivePeriodSchema = optionalTrimmedTextSchema.transform(
  (value): CinemaArchivePeriod => {
    if (!value) {
      return DEFAULT_ARCHIVE_PERIOD as CinemaArchivePeriod;
    }

    return (cinemaArchivePeriodValues as readonly string[]).includes(value)
      ? (value as CinemaArchivePeriod)
      : (DEFAULT_ARCHIVE_PERIOD as CinemaArchivePeriod);
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

export const CinemaArchiveQuerySchema = z.object({
  genre: optionalArchiveGenreSchema.optional(),
  language: optionalArchiveLanguageSchema.optional(),
  sort: archiveSortSchema.optional(),
  period: archivePeriodSchema.optional(),
  page: clampedArchivePageSchema.optional(),
  limit: clampedArchiveLimitSchema.optional(),
});

export type CinemaArchiveQuery = z.input<typeof CinemaArchiveQuerySchema>;

export type NormalizedCinemaArchiveQuery = {
  genre: string | null;
  language: string | null;
  sort: CinemaArchiveSort;
  period: CinemaArchivePeriod;
  page: number;
  limit: number;
};

export const normalizeMovieDetailQuery = (
  input: MovieDetailQuery,
): { reviewsSort: MovieDetailReviewSort } => {
  const parsed = MovieDetailQuerySchema.safeParse(input);
  return {
    reviewsSort: parsed.success
      ? (parsed.data.reviewsSort ?? DEFAULT_DETAIL_REVIEWS_SORT)
      : DEFAULT_DETAIL_REVIEWS_SORT,
  };
};

export const normalizeCinemaArchiveQuery = (
  input: CinemaArchiveQuery,
): NormalizedCinemaArchiveQuery => {
  const parsed = CinemaArchiveQuerySchema.safeParse(input);
  const data = parsed.success ? parsed.data : {};

  return {
    genre: data.genre ?? null,
    language: data.language ?? null,
    sort: data.sort ?? (DEFAULT_ARCHIVE_SORT as CinemaArchiveSort),
    period: data.period ?? (DEFAULT_ARCHIVE_PERIOD as CinemaArchivePeriod),
    page: data.page ?? DEFAULT_ARCHIVE_PAGE,
    limit: data.limit ?? DEFAULT_ARCHIVE_LIMIT,
  };
};
