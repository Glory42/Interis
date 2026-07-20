import { z } from "zod";

export const AdminListContentQuerySchema = z.object({
  username: z.string().trim().optional(),
  movieId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export type AdminListContentQuery = z.input<typeof AdminListContentQuerySchema>;
