import { z } from "zod";

export const feedActivityTypeSchema = z.enum([
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

export const feedActivityKindSchema = z.enum([
  "diary_entry",
  "review",
  "liked_movie",
  "watchlisted_movie",
  "followed_user",
  "created_list",
  "liked_review",
  "commented",
  "post",
  "liked_comment",
  "liked_post",
  "commented_post",
]);

export const feedActorSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayUsername: z.string().nullable(),
  image: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

export const feedMovieSchema = z
  .object({
    tmdbId: z.number().int().positive(),
    title: z.string(),
    posterPath: z.string().nullable(),
    releaseYear: z.number().int().nullable(),
    mediaType: z.enum(["movie", "tv"]).default("movie"),
  })
  .nullable();

export const feedPostMediaTypeSchema = z.enum(["movie", "tv", "book", "music"]);

export const feedPostSchema = z
  .object({
    id: z.string(),
    content: z.string(),
    mediaId: z.number().int().nullable(),
    mediaType: feedPostMediaTypeSchema.nullable(),
  })
  .nullable();

export const feedReviewSchema = z
  .object({
    id: z.string(),
    content: z.string(),
    containsSpoilers: z.boolean(),
    rating: z.number().nullable(),
  })
  .nullable();

export const feedMetadataSchema = z.object({
  action: z.string().nullable(),
  excerpt: z.string().nullable(),
  targetUsername: z.string().nullable(),
  rating: z.number().nullable(),
  rewatch: z.boolean().nullable(),
  hasReview: z.boolean().nullable().optional(),
  mediaType: z.enum(["movie", "tv"]).nullable().optional(),
  containsSpoilers: z.boolean().nullable(),
  reviewId: z.string().nullable(),
  commentId: z.string().nullable(),
  movieId: z.number().nullable(),
  postId: z.string().nullable(),
  postMediaId: z.number().nullable(),
  postMediaType: feedPostMediaTypeSchema.nullable(),
});

export const feedEngagementSchema = z.object({
  likeCount: z.number().int().nonnegative(),
  commentCount: z.number().int().nonnegative(),
  viewerHasLiked: z.boolean().nullable(),
});

export const feedItemSchema = z.object({
  id: z.string(),
  type: feedActivityTypeSchema,
  kind: feedActivityKindSchema,
  createdAt: z.string(),
  actor: feedActorSchema,
  movie: feedMovieSchema,
  post: feedPostSchema,
  review: feedReviewSchema,
  metadata: feedMetadataSchema,
  engagement: feedEngagementSchema,
});

export const feedListSchema = z.array(feedItemSchema);

export const trendingMovieSchema = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string(),
  posterPath: z.string().nullable(),
  releaseYear: z.number().int().nullable(),
});

export const trendingMovieListSchema = z.array(trendingMovieSchema);

export const meFeedSummarySchema = z.object({
  id: z.string(),
  username: z.string(),
  displayUsername: z.string().nullable(),
  image: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  counts: z.object({
    logs: z.number().int().nonnegative(),
    followers: z.number().int().nonnegative(),
    following: z.number().int().nonnegative(),
  }),
  recentPosters: z.array(
    z.object({
      tmdbId: z.number().int().positive(),
      title: z.string(),
      posterPath: z.string().nullable(),
    }),
  ),
});

export const networkStatsSchema = z.object({
  totalUsers: z.number().int().nonnegative(),
});

export type FeedItem = z.infer<typeof feedItemSchema>;
export type FeedActivityKind = z.infer<typeof feedActivityKindSchema>;
export type TrendingMovie = z.infer<typeof trendingMovieSchema>;
export type MeFeedSummary = z.infer<typeof meFeedSummarySchema>;
export type NetworkStats = z.infer<typeof networkStatsSchema>;
