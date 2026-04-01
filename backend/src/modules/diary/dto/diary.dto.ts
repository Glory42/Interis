import { z } from "zod";
import { isoDateSchema } from "../../../commons/validation/common.schemas";

const ratingOutOfFiveSchema = z
  .number()
  .min(0.5)
  .max(5)
  .multipleOf(0.5);

export const CreateDiarySchema = z.object({
  tmdbId: z.number().int().positive(),
  watchedDate: isoDateSchema,
  ratingOutOfFive: ratingOutOfFiveSchema.optional(),
  rewatch: z.boolean().optional(),
  review: z.string().max(5000).optional(),
  containsSpoilers: z.boolean().optional(),
});

export const UpdateDiarySchema = z.object({
  watchedDate: isoDateSchema.optional(),
  ratingOutOfFive: ratingOutOfFiveSchema.nullable().optional(),
  rewatch: z.boolean().optional(),
});

export type CreateDiaryDto = z.infer<typeof CreateDiarySchema>;
export type UpdateDiaryDto = z.infer<typeof UpdateDiarySchema>;
