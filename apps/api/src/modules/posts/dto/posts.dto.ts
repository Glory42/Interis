import { z } from "zod";
import { postMediaTypeEnum } from "../posts.entity";

export const CreatePostSchema = z
  .object({
    content: z.string().min(1).max(250),
    mediaId: z.number().int().positive().optional(),
    mediaType: z.enum(postMediaTypeEnum.enumValues).optional(),
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
