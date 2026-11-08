import { z } from "zod";
import { REVIEW_MAX_LENGTH } from "@/types/api";

export const seriesWatchStatusSchema = z.enum(["watching", "paused", "dropped", "completed"]);

// Statuses the user sets by hand; completed / none come from the watched toggle.
export const userSetSeriesWatchStatusSchema = z.enum(["watching", "paused", "dropped"]);

export const seriesInteractionSchema = z
  .object({
    liked: z.boolean(),
    watchlisted: z.boolean(),
    rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable(),
    watched: z.boolean(),
    watchStatus: seriesWatchStatusSchema.nullable().default(null),
  })
  .passthrough();

export const updateSeriesInteractionInputSchema = z
  .object({
    liked: z.boolean().optional(),
    watchlisted: z.boolean().optional(),
    rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
    watched: z.boolean().optional(),
    watchStatus: userSetSeriesWatchStatusSchema.optional(),
  })
  .refine(
    (payload) =>
      payload.liked !== undefined ||
      payload.watchlisted !== undefined ||
      payload.rating !== undefined ||
      payload.watched !== undefined ||
      payload.watchStatus !== undefined,
    {
      message: "At least one interaction field is required",
    },
  );

const seriesLogRatingSchema = z.number().min(0.5).max(10).multipleOf(0.5);

export const createSeriesLogInputSchema = z.object({
  watchedDate: z.string(),
  rating: seriesLogRatingSchema.optional(),
  rewatch: z.boolean().optional(),
  review: z.string().max(REVIEW_MAX_LENGTH).optional(),
  containsSpoilers: z.boolean().optional(),
});

export const createSeriesLogResponseSchema = z.object({
  entry: z
    .object({
      id: z.string(),
      userId: z.string(),
      seriesId: z.number().int(),
      watchedDate: z.string(),
      rating: z.number().nullable(),
      rewatch: z.boolean(),
      createdAt: z.string(),
      updatedAt: z.string(),
    })
    .passthrough(),
  series: z
    .object({
      id: z.number().int(),
      tmdbId: z.number().int(),
      title: z.string(),
      posterPath: z.string().nullable(),
      firstAirYear: z.number().int().nullable(),
    })
    .passthrough(),
  review: z
    .object({
      id: z.string(),
      content: z.string(),
      containsSpoilers: z.boolean(),
    })
    .nullable(),
});
