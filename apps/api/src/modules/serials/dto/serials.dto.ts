import { z } from "zod";
import { isoDateSchema } from "../../../commons/validation/common.schemas";
import {
  DEFAULT_ARCHIVE_LIMIT,
  DEFAULT_ARCHIVE_PAGE,
  DEFAULT_ARCHIVE_PERIOD,
  DEFAULT_ARCHIVE_SORT,
  DEFAULT_DETAIL_REVIEWS_SORT,
  MAX_ARCHIVE_LIMIT,
} from "../constants/serials.constants";

export const SearchSerialsQuerySchema = z.object({
  query: z.string().trim().min(1),
});

export type SearchSerialsQuery = z.input<typeof SearchSerialsQuerySchema>;

export const SerialParamsSchema = z.object({
  tmdbId: z.string(),
});

export type SerialParams = z.input<typeof SerialParamsSchema>;

export const SerialSeasonParamsSchema = z.object({
  tmdbId: z.string(),
  seasonNumber: z.coerce.number().int().min(0),
});

export type SerialSeasonParams = z.input<typeof SerialSeasonParamsSchema>;

export const serialArchiveSortValues = [
  "trending",
  "first_air_desc",
  "first_air_asc",
  "logs_desc",
  "rating_user_desc",
  "rating_tmdb_desc",
  "title_asc",
] as const;

export type SerialArchiveSort = (typeof serialArchiveSortValues)[number];

export const serialArchivePeriodValues = [
  "all_time",
  "this_year",
  "last_10_years",
  "this_week",
  "today",
] as const;

export type SerialArchivePeriod = (typeof serialArchivePeriodValues)[number];

export const serialDetailReviewSortValues = ["popular", "recent"] as const;

export type SerialDetailReviewSort = (typeof serialDetailReviewSortValues)[number];

export const SerialDetailQuerySchema = z.object({
  reviewsSort: z.enum(serialDetailReviewSortValues).optional(),
});

export type SerialDetailQuery = z.input<typeof SerialDetailQuerySchema>;

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

const archiveSortSchema = optionalTrimmedTextSchema.transform((value): SerialArchiveSort => {
  if (!value) {
    return DEFAULT_ARCHIVE_SORT as SerialArchiveSort;
  }

  return (serialArchiveSortValues as readonly string[]).includes(value)
    ? (value as SerialArchiveSort)
    : (DEFAULT_ARCHIVE_SORT as SerialArchiveSort);
});

const archivePeriodSchema = optionalTrimmedTextSchema.transform(
  (value): SerialArchivePeriod => {
    if (!value) {
      return DEFAULT_ARCHIVE_PERIOD as SerialArchivePeriod;
    }

    return (serialArchivePeriodValues as readonly string[]).includes(value)
      ? (value as SerialArchivePeriod)
      : (DEFAULT_ARCHIVE_PERIOD as SerialArchivePeriod);
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

export const SerialArchiveQuerySchema = z.object({
  genre: optionalArchiveGenreSchema.optional(),
  language: optionalArchiveLanguageSchema.optional(),
  sort: archiveSortSchema.optional(),
  period: archivePeriodSchema.optional(),
  page: clampedArchivePageSchema.optional(),
  limit: clampedArchiveLimitSchema.optional(),
});

export type SerialArchiveQuery = z.input<typeof SerialArchiveQuerySchema>;

export type NormalizedSerialArchiveQuery = {
  genre: string | null;
  language: string | null;
  sort: SerialArchiveSort;
  period: SerialArchivePeriod;
  page: number;
  limit: number;
};

export const normalizeSerialDetailQuery = (
  input: SerialDetailQuery,
): { reviewsSort: SerialDetailReviewSort } => {
  const parsed = SerialDetailQuerySchema.safeParse(input);
  return {
    reviewsSort: parsed.success
      ? (parsed.data.reviewsSort ?? DEFAULT_DETAIL_REVIEWS_SORT)
      : DEFAULT_DETAIL_REVIEWS_SORT,
  };
};

export const normalizeSerialArchiveQuery = (
  input: SerialArchiveQuery,
): NormalizedSerialArchiveQuery => {
  const parsed = SerialArchiveQuerySchema.safeParse(input);
  const data = parsed.success ? parsed.data : {};

  return {
    genre: data.genre ?? null,
    language: data.language ?? null,
    sort: data.sort ?? (DEFAULT_ARCHIVE_SORT as SerialArchiveSort),
    period: data.period ?? (DEFAULT_ARCHIVE_PERIOD as SerialArchivePeriod),
    page: data.page ?? DEFAULT_ARCHIVE_PAGE,
    limit: data.limit ?? DEFAULT_ARCHIVE_LIMIT,
  };
};

export const UpdateSerialInteractionSchema = z
  .object({
    liked: z.boolean().optional(),
    watchlisted: z.boolean().optional(),
    ratingOutOfFive: z.number().min(0.5).max(5).multipleOf(0.5).nullable().optional(),
  })
  .refine(
    (payload) =>
      payload.liked !== undefined ||
      payload.watchlisted !== undefined ||
      payload.ratingOutOfFive !== undefined,
    {
      message: "At least one of liked, watchlisted, or ratingOutOfFive must be provided",
    },
  );

const ratingOutOfFiveSchema = z.number().min(0.5).max(5).multipleOf(0.5);

export const CreateSerialLogSchema = z.object({
  watchedDate: isoDateSchema,
  ratingOutOfFive: ratingOutOfFiveSchema.optional(),
  rewatch: z.boolean().optional(),
  review: z.string().max(5000).optional(),
  containsSpoilers: z.boolean().optional(),
});

export type UpdateSerialInteractionDto = z.infer<typeof UpdateSerialInteractionSchema>;
export type CreateSerialLogDto = z.infer<typeof CreateSerialLogSchema>;
