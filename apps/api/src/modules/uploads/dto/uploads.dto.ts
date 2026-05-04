import { z } from "zod";

export const RequestUploadSchema = z.object({
  uploadType: z.literal("avatar"),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  fileSizeBytes: z
    .number()
    .int()
    .positive()
    .max(10 * 1024 * 1024),
});

export const ConfirmUploadSchema = z.object({
  uploadType: z.literal("avatar"),
  publicUrl: z.url(),
});

export type RequestUploadDto = z.infer<typeof RequestUploadSchema>;
export type ConfirmUploadDto = z.infer<typeof ConfirmUploadSchema>;
