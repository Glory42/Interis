import { z } from "zod";

export const AdminListListsQuerySchema = z.object({
  username: z.string().trim().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
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
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export type AdminListActivitiesQuery = z.input<typeof AdminListActivitiesQuerySchema>;
