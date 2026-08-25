import { z } from "zod";

export const UpdateInteractionSchema = z
  .object({
    liked: z.boolean().optional(),
    watchlisted: z.boolean().optional(),
    rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
    watched: z.boolean().optional(),
  })
  .refine(
    (d) =>
      d.liked !== undefined ||
      d.watchlisted !== undefined ||
      d.rating !== undefined ||
      d.watched !== undefined,
    {
      message: "At least one of liked, watchlisted, rating, or watched must be provided",
    },
  );

export type UpdateInteractionDto = z.infer<typeof UpdateInteractionSchema>;
