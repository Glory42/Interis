import { z } from "zod";
import { isoDateSchema } from "../../../commons/validation/common.schemas";
import { USER_SET_WATCH_STATUSES } from "../constants/tv-watch-status.constants";
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

export const SearchTvQuerySchema = z.object({
  query: z.string().trim().min(1),
});

export type SearchTvQuery = z.input<typeof SearchTvQuerySchema>;

export const SeriesParamsSchema = z.object({
  tmdbId: z.string(),
});

export type SeriesParams = z.input<typeof SeriesParamsSchema>;

export const SeriesSeasonParamsSchema = z.object({
  tmdbId: z.string(),
  seasonNumber: z.coerce.number().int().min(0),
});

export type SeriesSeasonParams = z.input<typeof SeriesSeasonParamsSchema>;

const seriesArchiveSortValues = [
  "trending",
  "first_air_desc",
  "first_air_asc",
  "logs_desc",
  "rating_user_desc",
  "rating_tmdb_desc",
  "title_asc",
] as const;

export type SeriesArchiveSort = (typeof seriesArchiveSortValues)[number];

const seriesArchivePeriodValues = [
  "all_time",
  "this_year",
  "last_10_years",
  "this_week",
  "today",
] as const;

export type SeriesArchivePeriod = (typeof seriesArchivePeriodValues)[number];

const seriesDetailReviewSortValues = ["popular", "recent"] as const;

export type SeriesDetailReviewSort = (typeof seriesDetailReviewSortValues)[number];

export const SeriesDetailQuerySchema = z.object({
  reviewsSort: z.enum(seriesDetailReviewSortValues).optional(),
  reviewsPage: z.coerce.number().int().min(1).optional(),
  reviewsLimit: z.coerce.number().int().min(1).max(MAX_DETAIL_REVIEWS_LIMIT).optional(),
});

export type SeriesDetailQuery = z.input<typeof SeriesDetailQuerySchema>;

export type NormalizedSeriesReviewsQuery = {
  reviewsSort: SeriesDetailReviewSort;
  reviewsPage: number;
  reviewsLimit: number;
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

const archiveSortSchema = optionalTrimmedTextSchema.transform((value): SeriesArchiveSort => {
  if (!value) {
    return DEFAULT_ARCHIVE_SORT as SeriesArchiveSort;
  }

  return (seriesArchiveSortValues as readonly string[]).includes(value)
    ? (value as SeriesArchiveSort)
    : (DEFAULT_ARCHIVE_SORT as SeriesArchiveSort);
});

const archivePeriodSchema = optionalTrimmedTextSchema.transform(
  (value): SeriesArchivePeriod => {
    if (!value) {
      return DEFAULT_ARCHIVE_PERIOD as SeriesArchivePeriod;
    }

    return (seriesArchivePeriodValues as readonly string[]).includes(value)
      ? (value as SeriesArchivePeriod)
      : (DEFAULT_ARCHIVE_PERIOD as SeriesArchivePeriod);
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

export const SeriesArchiveQuerySchema = z.object({
  genre: optionalArchiveGenreSchema.optional(),
  language: optionalArchiveLanguageSchema.optional(),
  sort: archiveSortSchema.optional(),
  period: archivePeriodSchema.optional(),
  page: clampedArchivePageSchema.optional(),
  limit: clampedArchiveLimitSchema.optional(),
});

export type SeriesArchiveQuery = z.input<typeof SeriesArchiveQuerySchema>;

export type NormalizedSeriesArchiveQuery = {
  genre: string | null;
  language: string | null;
  sort: SeriesArchiveSort;
  period: SeriesArchivePeriod;
  page: number;
  limit: number;
};

export const normalizeSeriesDetailQuery = (
  input: SeriesDetailQuery,
): NormalizedSeriesReviewsQuery => {
  const parsed = SeriesDetailQuerySchema.safeParse(input);
  const data = parsed.success ? parsed.data : {};

  return {
    reviewsSort: data.reviewsSort ?? (DEFAULT_DETAIL_REVIEWS_SORT as SeriesDetailReviewSort),
    reviewsPage: data.reviewsPage ?? DEFAULT_DETAIL_REVIEWS_PAGE,
    reviewsLimit: data.reviewsLimit ?? DEFAULT_DETAIL_REVIEWS_LIMIT,
  };
};

export const normalizeSeriesArchiveQuery = (
  input: SeriesArchiveQuery,
): NormalizedSeriesArchiveQuery => {
  const parsed = SeriesArchiveQuerySchema.safeParse(input);
  const data = parsed.success ? parsed.data : {};

  return {
    genre: data.genre ?? null,
    language: data.language ?? null,
    sort: data.sort ?? (DEFAULT_ARCHIVE_SORT as SeriesArchiveSort),
    period: data.period ?? (DEFAULT_ARCHIVE_PERIOD as SeriesArchivePeriod),
    page: data.page ?? DEFAULT_ARCHIVE_PAGE,
    limit: data.limit ?? DEFAULT_ARCHIVE_LIMIT,
  };
};

export const UpdateSeriesInteractionSchema = z
  .object({
    liked: z.boolean().optional(),
    watchlisted: z.boolean().optional(),
    rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
    watched: z.boolean().optional(),
    watchStatus: z.enum(USER_SET_WATCH_STATUSES).optional(),
  })
  .refine(
    (payload) =>
      payload.liked !== undefined ||
      payload.watchlisted !== undefined ||
      payload.rating !== undefined ||
      payload.watched !== undefined ||
      payload.watchStatus !== undefined,
    {
      message:
        "At least one of liked, watchlisted, rating, watched, or watchStatus must be provided",
    },
  );

const ratingSchema = z.number().min(0.5).max(10).multipleOf(0.5);

export const CreateSeriesLogSchema = z.object({
  watchedDate: isoDateSchema,
  rating: ratingSchema.optional(),
  rewatch: z.boolean().optional(),
  review: z.string().max(5000).optional(),
  containsSpoilers: z.boolean().optional(),
});

export const UpdateSeriesLogSchema = z.object({
  watchedDate: isoDateSchema.optional(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
  rewatch: z.boolean().optional(),
});

// DELETE /api/serials/logs/:id?unwatch=true also unmarks the series and its
// episodes when this was the user's last log of it (#88).
export const DeleteSeriesLogQuerySchema = z.object({
  unwatch: z.stringbool().optional(),
});

export type UpdateSeriesInteractionDto = z.infer<typeof UpdateSeriesInteractionSchema>;
export type CreateSeriesLogDto = z.infer<typeof CreateSeriesLogSchema>;
export type UpdateSeriesLogDto = z.infer<typeof UpdateSeriesLogSchema>;
export type DeleteSeriesLogQueryDto = z.infer<typeof DeleteSeriesLogQuerySchema>;

const DEFAULT_LOGS_LIMIT = 50;

export const SeriesLogsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type SeriesLogsQuery = z.input<typeof SeriesLogsQuerySchema>;

// Always returns a bounded limit/offset (even with no query params) so the
// serials logs endpoints (a viewer's own diary, and everyone's logs for a
// given series) never fetch an entire unbounded collection in one request.
export const normalizeSeriesLogsQuery = (
  input: unknown,
): { limit: number; offset: number } => {
  const parsed = SeriesLogsQuerySchema.safeParse(input);
  if (!parsed.success) {
    return { limit: DEFAULT_LOGS_LIMIT, offset: 0 };
  }

  return {
    limit: parsed.data.limit ?? DEFAULT_LOGS_LIMIT,
    offset: parsed.data.offset ?? 0,
  };
};

export const SeriesEpisodeParamsSchema = z.object({
  tmdbId: z.string(),
  seasonNumber: z.coerce.number().int().min(0),
  episodeNumber: z.coerce.number().int().min(1),
});

export type SeriesEpisodeParams = z.input<typeof SeriesEpisodeParamsSchema>;

// A season holds at most a few hundred episodes; cap the batch the upsert builds.
export const WatchedThroughParamsSchema = SeriesEpisodeParamsSchema.extend({
  episodeNumber: z.coerce.number().int().min(1).max(500),
});

export const UpdateSeasonInteractionSchema = z.object({
  watched: z.boolean().optional(),
  liked: z.boolean().optional(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
});

export type UpdateSeasonInteractionDto = z.infer<typeof UpdateSeasonInteractionSchema>;

// A user can have several reviews of one season/episode (#72). `reviewId`
// edits that review, `createNew` writes another one, and with neither the
// newest review is edited (or the first one written).
export const SeasonReviewInputSchema = z
  .object({
    content: z.string().min(1).max(10000),
    containsSpoilers: z.boolean().optional(),
    reviewId: z.string().uuid().optional(),
    createNew: z.boolean().optional(),
  })
  .refine((input) => !(input.reviewId && input.createNew), {
    message: "Pass either reviewId or createNew, not both",
  });

export type SeasonReviewInputDto = z.infer<typeof SeasonReviewInputSchema>;

// Without a reviewId, DELETE removes the newest review.
export const SeasonReviewDeleteQuerySchema = z.object({
  reviewId: z.string().uuid().optional(),
});
