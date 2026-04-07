import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const reviewMediaTypeSchema = z.enum(["movie", "tv"]);

const reviewCommentSchema = z
  .object({
    id: z.string(),
    userId: z.string(),
    reviewId: z.string(),
    content: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),
    authorUsername: z.string(),
    authorDisplayUsername: z.string().nullable(),
    authorAvatarUrl: z.string().nullable(),
    authorImage: z.string().nullable(),
  })
  .passthrough();

const reviewCommentListSchema = z.array(reviewCommentSchema);

const addReviewCommentInputSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

const updateReviewInputSchema = z
  .object({
    content: z.string().trim().min(1).max(10000).optional(),
    containsSpoilers: z.boolean().optional(),
  })
  .refine(
    (input) => input.content !== undefined || input.containsSpoilers !== undefined,
    {
      message: "At least one review field must be provided",
    },
  );

const updatedReviewSchema = z
  .object({
    id: z.string(),
    content: z.string(),
    containsSpoilers: z.boolean(),
    updatedAt: z.string(),
  })
  .passthrough();

const reviewDetailSchema = z.object({
  id: z.string(),
  mediaType: reviewMediaTypeSchema,
  content: z.string(),
  containsSpoilers: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  ratingOutOfTen: z.number().nullable(),
  ratingOutOfFive: z.number().nullable(),
  author: z.object({
    id: z.string(),
    username: z.string(),
    displayUsername: z.string().nullable(),
    image: z.string().nullable(),
    avatarUrl: z.string().nullable(),
  }),
  media: z.object({
    tmdbId: z.number().int().positive(),
    title: z.string(),
    posterPath: z.string().nullable(),
    releaseYear: z.number().int().nullable(),
    genres: z
      .array(
        z.object({
          id: z.number().int(),
          name: z.string(),
        }),
      )
      .nullish()
      .transform((value) => value ?? []),
    director: z.string().nullable(),
    creator: z.string().nullable(),
  }),
  engagement: z.object({
    likeCount: z.number().int().nonnegative(),
    commentCount: z.number().int().nonnegative(),
    viewerHasLiked: z.boolean().nullable(),
  }),
});

const likeReviewResponseSchema = z.object({
  liked: z.boolean(),
  alreadyLiked: z.boolean().optional(),
});

const unlikeReviewResponseSchema = z.object({
  liked: z.literal(false),
});

export type ReviewComment = z.infer<typeof reviewCommentSchema>;
export type ReviewMediaType = z.infer<typeof reviewMediaTypeSchema>;
export type ReviewDetail = z.infer<typeof reviewDetailSchema>;

type AddReviewCommentInput = z.infer<typeof addReviewCommentInputSchema>;
type UpdateReviewInput = z.infer<typeof updateReviewInputSchema>;
type QueryRequestOptions = {
  signal?: AbortSignal;
};

export type UpdatedReview = z.infer<typeof updatedReviewSchema>;

const toReviewBasePath = (reviewId: string): string => {
  return `/api/reviews/${encodeURIComponent(reviewId)}`;
};

export const getProfileReviewDetail = async (
  username: string,
  reviewId: string,
  options: QueryRequestOptions = {},
): Promise<ReviewDetail> => {
  const response = await apiRequest<unknown>(
    `/api/users/${encodeURIComponent(username)}/reviews/${encodeURIComponent(reviewId)}`,
    {
      method: "GET",
      cache: "no-store",
      signal: options.signal,
    },
  );

  return reviewDetailSchema.parse(response);
};

export const getReviewComments = async (
  reviewId: string,
): Promise<ReviewComment[]> => {
  const response = await apiRequest<unknown>(`${toReviewBasePath(reviewId)}/comments`, {
    method: "GET",
  });

  return reviewCommentListSchema.parse(response);
};

export const addReviewComment = async (
  reviewId: string,
  input: AddReviewCommentInput,
): Promise<ReviewComment> => {
  const payload = addReviewCommentInputSchema.parse(input);

  const response = await apiRequest<unknown, AddReviewCommentInput>(
    `${toReviewBasePath(reviewId)}/comments`,
    {
      method: "POST",
      body: payload,
    },
  );

  return reviewCommentSchema.parse(response);
};

export const likeReview = async (reviewId: string) => {
  const response = await apiRequest<unknown>(`${toReviewBasePath(reviewId)}/like`, {
    method: "POST",
  });

  return likeReviewResponseSchema.parse(response);
};

export const unlikeReview = async (reviewId: string) => {
  const response = await apiRequest<unknown>(`${toReviewBasePath(reviewId)}/like`, {
    method: "DELETE",
  });

  return unlikeReviewResponseSchema.parse(response);
};

export const updateReview = async (
  reviewId: string,
  input: UpdateReviewInput,
): Promise<UpdatedReview> => {
  const payload = updateReviewInputSchema.parse(input);

  const response = await apiRequest<unknown, UpdateReviewInput>(
    `${toReviewBasePath(reviewId)}`,
    {
      method: "PUT",
      body: payload,
    },
  );

  return updatedReviewSchema.parse(response);
};
