import { z } from "zod";
import { isoDateSchema } from "../../../commons/validation/common.schemas";

const ratingSchema = z
  .number()
  .min(0.5)
  .max(10)
  .multipleOf(0.5);

export const CreateDiarySchema = z.object({
  tmdbId: z.number().int().positive(),
  watchedDate: isoDateSchema,
  rating: ratingSchema.optional(),
  rewatch: z.boolean().optional(),
  review: z.string().max(5000).optional(),
  containsSpoilers: z.boolean().optional(),
});

export const UpdateDiarySchema = z.object({
  watchedDate: isoDateSchema.optional(),
  rating: ratingSchema.nullable().optional(),
  rewatch: z.boolean().optional(),
});

// Bounds GET /api/diary so a large diary can't be fetched in one
// unbounded request — mirrors ProfileListQuerySchema in the users module.
// The default is intentionally generous (not the 60-100 used for public
// profile-list endpoints): the frontend's diary page still fetches this
// route unpaginated today, so a small default would silently truncate any
// moderately active user's diary. This just adds a safety ceiling until
// the diary page gets real pagination.
export const DiaryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(2000).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export type CreateDiaryDto = z.infer<typeof CreateDiarySchema>;
export type UpdateDiaryDto = z.infer<typeof UpdateDiarySchema>;
export type DiaryQueryDto = z.infer<typeof DiaryQuerySchema>;
