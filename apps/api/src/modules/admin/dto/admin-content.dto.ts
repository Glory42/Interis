import { z } from "zod";
import { paginationQuerySchema } from "../../../commons/validation/common.schemas";
import { MEDIA_TYPES } from "../../media/constants/media-type.constant";

export const AdminListContentQuerySchema = z.object({
  username: z.string().trim().optional(),
  movieId: z.coerce.number().int().positive().optional(),
  ...paginationQuerySchema.shape,
});

export type AdminListContentQuery = z.input<typeof AdminListContentQuerySchema>;

// Logs are listed per media type, Films by default; `seriesId` filters Series logs.
export const AdminListLogsQuerySchema = AdminListContentQuerySchema.extend({
  mediaType: z.enum(MEDIA_TYPES).default("movie"),
  seriesId: z.coerce.number().int().positive().optional(),
});
export type AdminListLogsQuery = z.input<typeof AdminListLogsQuerySchema>;

// Without a media type, removal finds the log in either table.
export const AdminDeleteLogQuerySchema = z.object({ mediaType: z.enum(MEDIA_TYPES).optional() });

export const AdminListCommentsQuerySchema = z.object({ ...paginationQuerySchema.shape });
export type AdminListCommentsQuery = z.input<typeof AdminListCommentsQuerySchema>;

export const AdminCommentParamsSchema = z.object({
  kind: z.enum(["review", "post"]),
  id: z.string().min(1),
});
