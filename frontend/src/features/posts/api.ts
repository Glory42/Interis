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

const createdPostSchema = z.object({
  id: z.string(),
  userId: z.string(),
  content: z.string(),
  mediaId: z.number().int().nullable(),
  mediaType: postMediaTypeSchema.nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CreatePostInput = {
  content: string;
  mediaId?: number;
  mediaType?: z.infer<typeof postMediaTypeSchema>;
};

export const createPost = async (payload: CreatePostInput) => {
  const normalizedPayload = createPostInputSchema.parse(payload);

  const response = await apiRequest<unknown, CreatePostInput>("/api/posts", {
    method: "POST",
    body: normalizedPayload,
  });

  return createdPostSchema.parse(response);
};
