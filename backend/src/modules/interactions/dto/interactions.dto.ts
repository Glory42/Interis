import { z } from "zod";

export const UpdateInteractionSchema = z
  .object({
    liked: z.boolean().optional(),
    watchlisted: z.boolean().optional(),
  })
  .refine((d) => d.liked !== undefined || d.watchlisted !== undefined, {
    message: "At least one of liked or watchlisted must be provided",
  });

export type UpdateInteractionDto = z.infer<typeof UpdateInteractionSchema>;
