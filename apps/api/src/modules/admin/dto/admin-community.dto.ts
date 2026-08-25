import { z } from "zod";
import { paginationQuerySchema } from "../../../commons/validation/common.schemas";

export const AdminListListsQuerySchema = z.object({
  username: z.string().trim().optional(),
  ...paginationQuerySchema.shape,
});

export type AdminListListsQuery = z.input<typeof AdminListListsQuerySchema>;

const activityTypeSchema = z.enum([
  "diary_entry",
  "review",
  "liked_movie",
  "watchlisted_movie",
  "followed_user",
  "created_list",
  "liked_review",
  "commented",
  "post",
]);

export const AdminListActivitiesQuerySchema = z.object({
  username: z.string().trim().optional(),
  type: activityTypeSchema.optional(),
  ...paginationQuerySchema.shape,
});

export type AdminListActivitiesQuery = z.input<typeof AdminListActivitiesQuerySchema>;
