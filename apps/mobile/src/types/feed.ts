import { z } from "zod";
import { mediaTypeSchema } from "./common";

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

export const feedItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  kind: feedActivityKindSchema,
  createdAt: z.string(),
  actor: z.object({
    id: z.string(),
    username: z.string(),
    displayUsername: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }),
  movie: z
    .object({
      tmdbId: z.number().int().positive(),
      title: z.string(),
      posterPath: z.string().nullable(),
      releaseYear: z.number().int().nullable(),
      mediaType: mediaTypeSchema.default("movie"),
    })
    .nullable(),
  post: z
    .object({
      id: z.string(),
      content: z.string(),
      mediaId: z.number().int().nullable(),
      mediaType: mediaTypeSchema.nullable(),
    })
    .nullable(),
  review: z
    .object({
      id: z.string(),
      content: z.string(),
      containsSpoilers: z.boolean(),
      rating: z.number().nullable(),
    })
    .nullable(),
  metadata: z.object({
    action: z.string().nullable(),
    excerpt: z.string().nullable(),
    targetUsername: z.string().nullable(),
    rating: z.number().nullable(),
    rewatch: z.boolean().nullable(),
    hasReview: z.boolean().nullable().optional(),
    mediaType: mediaTypeSchema.nullable().optional(),
    containsSpoilers: z.boolean().nullable(),
    reviewId: z.string().nullable(),
    commentId: z.string().nullable(),
    movieId: z.number().nullable(),
    postId: z.string().nullable(),
    postMediaId: z.number().nullable(),
    postMediaType: mediaTypeSchema.nullable(),
    seasonNumber: z.number().nullable().optional(),
    episodeNumber: z.number().nullable().optional(),
    listId: z.string().nullable().optional(),
    listTitle: z.string().nullable().optional(),
  }),
  engagement: z.object({
    likeCount: z.number().int().nonnegative(),
    commentCount: z.number().int().nonnegative(),
    viewerHasLiked: z.boolean().nullable(),
  }),
});

export const feedListSchema = z.array(feedItemSchema);

export const feedPageSchema = z.object({
  items: z.array(feedItemSchema),
  nextCursor: z.string().nullable(),
});

export const trendingItemSchema = z.object({
  tmdbId: z.number().int().positive(),
  title: z.string(),
  posterPath: z.string().nullable(),
  releaseYear: z.number().int().nullable().optional(),
  firstAirYear: z.number().int().nullable().optional(),
});

export type FeedItem = z.infer<typeof feedItemSchema>;
export type FeedPage = z.infer<typeof feedPageSchema>;
export type FeedActivityKind = z.infer<typeof feedActivityKindSchema>;
export type TrendingItem = z.infer<typeof trendingItemSchema>;
export type FeedFilter = "all" | "movie" | "serial";
