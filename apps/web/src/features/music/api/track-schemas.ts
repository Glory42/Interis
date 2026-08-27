import { z } from "zod";

export const trackSchema = z.object({
  id: z.number().int(),
  mbid: z.string(),
  title: z.string(),
  artistName: z.string(),
  length: z.number().int().nullable(),
  disambiguation: z.string().nullable(),
  previewUrl: z.string().nullable(),
});

export const trackDetailReviewItemSchema = z.object({
  id: z.string(),
  content: z.string(),
  containsSpoilers: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  listenedDate: z.string().nullable(),
  rating: z.number().nullable(),
  likeCount: z.number().int(),
  viewerHasLiked: z.boolean(),
  author: z.object({
    id: z.string(),
    username: z.string(),
    displayUsername: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }),
});

export const trackDetailResponseSchema = z.object({
  track: trackSchema,
  logsCount: z.number().int(),
  reviewCount: z.number().int(),
  userLog: z.object({
    diaryEntryId: z.string().nullable(),
    listenedDate: z.string().nullable(),
    relisten: z.boolean(),
    rating: z.number().nullable(),
  }).nullable(),
  interaction: z.object({
    liked: z.boolean(),
    rating: z.number().nullable(),
  }).nullable(),
  reviewsSort: z.string(),
  reviews: z.array(trackDetailReviewItemSchema),
});

export const trackInteractionSchema = z.object({
  liked: z.boolean(),
  rating: z.number().nullable(),
});

export const myTrackLogSchema = z.object({
  id: z.string(),
  listenedDate: z.string(),
  rating: z.number().nullable(),
  relisten: z.boolean(),
  trackId: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
  trackMbid: z.string(),
  trackTitle: z.string(),
  trackArtistName: z.string(),
  reviewId: z.string().nullable(),
  reviewContent: z.string().nullable(),
});

export const myTrackLogsListSchema = z.array(myTrackLogSchema);

export const updateTrackLogInputSchema = z.object({
  listenedDate: z.string().optional(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
  relisten: z.boolean().optional(),
});

export const createTrackLogInputSchema = z.object({
  listenedDate: z.string(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).optional(),
  relisten: z.boolean().optional(),
});

export const createTrackLogResultSchema = z
  .object({
    entry: z.object({ id: z.string() }).passthrough(),
  })
  .passthrough();

export const updateTrackInteractionInputSchema = z.object({
  liked: z.boolean().optional(),
  rating: z.number().min(0.5).max(10).multipleOf(0.5).nullable().optional(),
});
