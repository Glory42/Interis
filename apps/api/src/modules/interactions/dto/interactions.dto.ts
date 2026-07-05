import { z } from "zod";

export const UpdateInteractionSchema = z
  .object({
    liked: z.boolean().optional(),
    watchlisted: z.boolean().optional(),
    ratingOutOfFive: z.number().min(0.5).max(5).multipleOf(0.5).nullable().optional(),
    watched: z.boolean().optional(),
  })
  .refine(
    (d) =>
      d.liked !== undefined ||
      d.watchlisted !== undefined ||
      d.ratingOutOfFive !== undefined ||
      d.watched !== undefined,
    {
      message: "At least one of liked, watchlisted, ratingOutOfFive, or watched must be provided",
    },
  );

export type UpdateInteractionDto = z.infer<typeof UpdateInteractionSchema>;
