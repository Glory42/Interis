import { z } from "zod";

export const CreateReviewSchema = z.object({
  mediaSourceId: z.string().min(1).max(200),
  mediaType: z.enum(["movie", "tv", "album", "book"]).default("movie"),
  content: z.string().min(1).max(10000),
  containsSpoilers: z.boolean().optional(),
  diaryEntryId: z.uuid().optional(),
});

export const UpdateReviewSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  containsSpoilers: z.boolean().optional(),
});

export const ReviewCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewDto = z.infer<typeof UpdateReviewSchema>;
export type ReviewCommentDto = z.infer<typeof ReviewCommentSchema>;
