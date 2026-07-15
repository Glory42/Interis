import { z } from "zod";

export const serialInteractionSchema = z
  .object({
    liked: z.boolean(),
    watchlisted: z.boolean(),
    rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable(),
    watched: z.boolean(),
  })
  .passthrough();

export const updateSerialInteractionInputSchema = z
  .object({
    liked: z.boolean().optional(),
    watchlisted: z.boolean().optional(),
    rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
    watched: z.boolean().optional(),
  })
  .refine(
    (payload) =>
      payload.liked !== undefined ||
      payload.watchlisted !== undefined ||
      payload.rating !== undefined ||
      payload.watched !== undefined,
    {
      message: "At least one interaction field is required",
    },
  );

const serialLogRatingSchema = z.number().min(0.5).max(10).multipleOf(0.5);

export const createSeriesLogInputSchema = z.object({
  watchedDate: z.string(),
  rating: serialLogRatingSchema.optional(),
  rewatch: z.boolean().optional(),
  review: z.string().max(5000).optional(),
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
