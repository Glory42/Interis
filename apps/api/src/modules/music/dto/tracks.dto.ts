import { z } from "zod";
import { isoDateSchema } from "../../../commons/validation/common.schemas";

export const CreateTrackLogSchema = z.object({
  listenedDate: isoDateSchema,
  rating: z.number().min(0.5).max(10).multipleOf(0.5).optional(),
  relisten: z.boolean().optional(),
});

export const UpdateTrackLogSchema = z.object({
  listenedDate: isoDateSchema.optional(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
  relisten: z.boolean().optional(),
});

export const UpdateTrackInteractionSchema = z.object({
  liked: z.boolean().optional(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
});

export type CreateTrackLogDto = z.infer<typeof CreateTrackLogSchema>;
export type UpdateTrackLogDto = z.infer<typeof UpdateTrackLogSchema>;
export type UpdateTrackInteractionDto = z.infer<typeof UpdateTrackInteractionSchema>;
