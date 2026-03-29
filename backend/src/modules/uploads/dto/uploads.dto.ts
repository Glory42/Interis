import { z } from "zod";

export const RequestUploadSchema = z.object({
  uploadType: z.enum(["avatar", "backdrop"]),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  fileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024),
});

export const ConfirmUploadSchema = z.object({
  uploadType: z.enum(["avatar", "backdrop"]),
  publicUrl: z.string().url(),
});

export type RequestUploadDto = z.infer<typeof RequestUploadSchema>;
export type ConfirmUploadDto = z.infer<typeof ConfirmUploadSchema>;
