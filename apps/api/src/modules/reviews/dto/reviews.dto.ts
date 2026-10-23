import { z } from "zod";
import { MEDIA_TYPES } from "../../media/constants/media-type.constant";
import { REVIEW_MEDIA_TYPES } from "../constants/review-media-type.constant";

export const CreateReviewSchema = z.object({
  tmdbId: z.number().int().positive(),
  mediaType: z.enum(MEDIA_TYPES).default("movie"),
  content: z.string().min(1).max(10000),
  containsSpoilers: z.boolean().optional(),
  diaryEntryId: z.uuid().optional(),
});

export const UpdateReviewSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  containsSpoilers: z.boolean().optional(),
});

// One title's reviews by the signed-in user: a movie, a series, or one of
// its seasons / episodes.
export const MyTitleReviewsQuerySchema = z
  .object({
    mediaType: z.enum(REVIEW_MEDIA_TYPES),
    tmdbId: z.coerce.number().int().positive(),
    seasonNumber: z.coerce.number().int().min(0).optional(),
    episodeNumber: z.coerce.number().int().positive().optional(),
  })
  .refine(
    (query) =>
      query.mediaType === "tv_season"
        ? query.seasonNumber !== undefined && query.episodeNumber === undefined
        : query.mediaType === "tv_episode"
          ? query.seasonNumber !== undefined && query.episodeNumber !== undefined
          : query.seasonNumber === undefined && query.episodeNumber === undefined,
    { message: "seasonNumber / episodeNumber must match mediaType" },
  );

export const ReviewCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export type CreateReviewDto = z.infer<typeof CreateReviewSchema>;
export type UpdateReviewDto = z.infer<typeof UpdateReviewSchema>;
export type MyTitleReviewsQueryDto = z.infer<typeof MyTitleReviewsQuerySchema>;
