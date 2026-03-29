import { z } from "zod";

export const CreateDiarySchema = z.object({
  tmdbId: z.number().int().positive(),
  watchedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  rating: z.number().int().min(0).max(10).optional(),
  rewatch: z.boolean().optional(),
  review: z.string().max(5000).optional(),
  containsSpoilers: z.boolean().optional(),
});

export const UpdateDiarySchema = z.object({
  watchedDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  rating: z.number().int().min(0).max(10).nullable().optional(),
  rewatch: z.boolean().optional(),
});

export type CreateDiaryDto = z.infer<typeof CreateDiarySchema>;
export type UpdateDiaryDto = z.infer<typeof UpdateDiarySchema>;
