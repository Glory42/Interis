import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const postMediaTypeSchema = z.enum(["movie", "tv", "book", "music"]);

const createPostInputSchema = z
  .object({
    content: z.string().trim().min(1).max(250),
    mediaId: z.number().int().positive().optional(),
    mediaType: postMediaTypeSchema.optional(),
  })
  .refine(
    (input) =>
      !(input.mediaId && !input.mediaType) && !(!input.mediaId && input.mediaType),
    {
      message: "mediaId and mediaType must both be present or both absent",
    },
  );

const updatePostInputSchema = z.object({
  content: z.string().trim().min(1).max(250),
});

const postCommentInputSchema = z.object({
  content: z.string().trim().min(1).max(1000),
});

const postBaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  content: z.string(),
  mediaId: z.number().int().nullable(),
  mediaType: postMediaTypeSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const postDetailSchema = postBaseSchema
  .extend({
    likeCount: z.number().int().nonnegative().default(0),
    author: z
      .object({
        username: z.string(),
        displayUsername: z.string().nullable(),
        avatarUrl: z.string().nullable(),
      })
      .nullable()
      .optional(),
  })
  .passthrough();

const postLikeResponseSchema = z
  .object({
    liked: z.boolean(),
    wasNew: z.boolean().optional(),
  })
  .passthrough();

const postUnlikeResponseSchema = z.object({
  liked: z.literal(false),
});

const postCommentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  postId: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  authorUsername: z.string().nullable().optional(),
  authorDisplayUsername: z.string().nullable().optional(),
  authorAvatarUrl: z.string().nullable().optional(),
});

const postCommentListRowSchema = z.object({
  comment: postCommentSchema.omit({
    authorUsername: true,
    authorDisplayUsername: true,
    authorAvatarUrl: true,
  }),
  authorUsername: z.string(),
  authorDisplayUsername: z.string().nullable(),
  authorAvatarUrl: z.string().nullable(),
});

const postCommentListSchema = z.array(postCommentListRowSchema);

export type CreatePostInput = {
  content: string;
  mediaId?: number;
  mediaType?: z.infer<typeof postMediaTypeSchema>;
};

export type UpdatePostInput = {
  content: string;
};

export type PostCommentInput = {
  content: string;
};

export type PostDetail = z.infer<typeof postDetailSchema>;
export type PostComment = z.infer<typeof postCommentSchema>;

const toPostBasePath = (postId: string): string => {
  return `/api/posts/${encodeURIComponent(postId)}`;
};

export const createPost = async (payload: CreatePostInput) => {
  const normalizedPayload = createPostInputSchema.parse(payload);

  const response = await apiRequest<unknown, CreatePostInput>("/api/posts", {
    method: "POST",
    body: normalizedPayload,
  });

  return postBaseSchema.parse(response);
};

export const updatePost = async (postId: string, payload: UpdatePostInput) => {
  const normalizedPayload = updatePostInputSchema.parse(payload);

  const response = await apiRequest<unknown, UpdatePostInput>(toPostBasePath(postId), {
    method: "PUT",
    body: normalizedPayload,
  });

  return postBaseSchema.parse(response);
};

export const getPostById = async (postId: string): Promise<PostDetail> => {
  const response = await apiRequest<unknown>(toPostBasePath(postId), {
    method: "GET",
  });

  return postDetailSchema.parse(response);
};

export const getPostComments = async (postId: string): Promise<PostComment[]> => {
  const response = await apiRequest<unknown>(`${toPostBasePath(postId)}/comments`, {
    method: "GET",
  });

  return postCommentListSchema.parse(response).map((row) => ({
    ...row.comment,
    authorUsername: row.authorUsername,
    authorDisplayUsername: row.authorDisplayUsername,
    authorAvatarUrl: row.authorAvatarUrl,
  }));
};

export const addPostComment = async (
  postId: string,
  payload: PostCommentInput,
): Promise<PostComment> => {
  const normalizedPayload = postCommentInputSchema.parse(payload);

  const response = await apiRequest<unknown, PostCommentInput>(
    `${toPostBasePath(postId)}/comments`,
    {
      method: "POST",
      body: normalizedPayload,
    },
  );

  return postCommentSchema.parse(response);
};

export const likePost = async (postId: string) => {
  const response = await apiRequest<unknown>(`${toPostBasePath(postId)}/like`, {
    method: "POST",
  });

  return postLikeResponseSchema.parse(response);
};

export const unlikePost = async (postId: string) => {
  const response = await apiRequest<unknown>(`${toPostBasePath(postId)}/like`, {
    method: "DELETE",
  });

  return postUnlikeResponseSchema.parse(response);
};
