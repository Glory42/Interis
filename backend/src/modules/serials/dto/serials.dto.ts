import { z } from "zod";
import { isoDateSchema } from "../../../commons/validation/common.schemas";

export type SearchSerialsQuery = { query: string };
export type SerialParams = { tmdbId: string };
export type SerialSeasonParams = { tmdbId: string; seasonNumber: string };

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

export type SerialArchiveQuery = {
  genre?: string;
  language?: string;
  sort?: string;
  period?: string;
  page?: string;
  limit?: string;
};

export const serialDetailReviewSortValues = ["popular", "recent"] as const;

export type SerialDetailReviewSort = (typeof serialDetailReviewSortValues)[number];

export type SerialDetailQuery = {
  reviewsSort?: string;
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
