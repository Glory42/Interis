import { z } from "zod";
import { mediaTypeSchema, userSummarySchema } from "./common";

export const reviewDetailSchema = z.object({
  id: z.string(),
  mediaType: mediaTypeSchema,
  content: z.string(),
  containsSpoilers: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  rating: z.number().nullable(),
  author: userSummarySchema,
  media: z.object({
    tmdbId: z.number().int().positive(),
    title: z.string(),
    posterPath: z.string().nullable(),
    releaseYear: z.number().int().nullable(),
    director: z.string().nullable(),
    creator: z.string().nullable(),
  }),
  engagement: z.object({
    likeCount: z.number().int().nonnegative(),
    commentCount: z.number().int().nonnegative(),
    viewerHasLiked: z.boolean().nullable(),
  }),
});

export const reviewCommentSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    content: z.string(),
    createdAt: z.string(),
    authorUsername: z.string(),
    authorDisplayUsername: z.string().nullable(),
    authorAvatarUrl: z.string().nullable(),
  })
  .passthrough();

export const likeReviewResponseSchema = z.object({ liked: z.boolean() }).passthrough();

export type ReviewDetail = z.infer<typeof reviewDetailSchema>;
export type ReviewComment = z.infer<typeof reviewCommentSchema>;
