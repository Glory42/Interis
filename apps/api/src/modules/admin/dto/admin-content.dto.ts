import { z } from "zod";
import { paginationQuerySchema } from "../../../commons/validation/common.schemas";

export const AdminListContentQuerySchema = z.object({
  username: z.string().trim().optional(),
  movieId: z.coerce.number().int().positive().optional(),
  ...paginationQuerySchema.shape,
});

export type AdminListContentQuery = z.input<typeof AdminListContentQuerySchema>;
