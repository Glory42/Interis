import { z } from "zod";
import { paginationQuerySchema } from "../../../commons/validation/common.schemas";

export const AdminListContentQuerySchema = z.object({
  username: z.string().trim().optional(),
  movieId: z.coerce.number().int().positive().optional(),
  ...paginationQuerySchema.shape,
});

export type AdminListContentQuery = z.input<typeof AdminListContentQuerySchema>;

export const AdminListCommentsQuerySchema = z.object({ ...paginationQuerySchema.shape });
export type AdminListCommentsQuery = z.input<typeof AdminListCommentsQuerySchema>;

export const AdminCommentParamsSchema = z.object({
  kind: z.enum(["review", "post"]),
  id: z.string().min(1),
});
