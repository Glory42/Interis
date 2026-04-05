import { z } from "zod";

export const CreatePostSchema = z
  .object({
    content: z.string().min(1).max(250),
    mediaId: z.number().int().positive().optional(),
    mediaType: z.enum(["movie", "tv", "book", "music"]).optional(),
  })
  .refine((d) => !(d.mediaId && !d.mediaType) && !(!d.mediaId && d.mediaType), {
    message: "mediaId and mediaType must both be present or both absent",
  });

export const UpdatePostSchema = z.object({
  content: z.string().min(1).max(250),
});

export const PostCommentSchema = z.object({
  content: z.string().min(1).max(1000),
});

export type CreatePostDto = z.infer<typeof CreatePostSchema>;
export type UpdatePostDto = z.infer<typeof UpdatePostSchema>;
export type PostCommentDto = z.infer<typeof PostCommentSchema>;
