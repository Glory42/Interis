import { z } from "zod";
import { MEDIA_TYPES } from "../../media/constants/media-type.constant";

export const CreateReviewSchema = z.object({
  mediaSourceId: z.string().min(1).max(200),
  mediaType: z.enum(MEDIA_TYPES).default("movie"),
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
