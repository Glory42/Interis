import { z } from "zod";
import { apiRequest } from "@/lib/api-client";

const uploadTypeSchema = z.enum(["avatar", "backdrop"]);
const uploadContentTypeSchema = z.enum([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const requestUploadInputSchema = z.object({
  uploadType: uploadTypeSchema,
  contentType: uploadContentTypeSchema,
  fileSizeBytes: z.number().int().positive(),
});

const requestUploadResponseSchema = z.object({
  signedUrl: z.string().url(),
  publicUrl: z.string().url(),
});

const confirmUploadInputSchema = z.object({
  uploadType: uploadTypeSchema,
  publicUrl: z.string().url(),
});

export type ProfileUploadType = z.infer<typeof uploadTypeSchema>;
export type ProfileUploadContentType = z.infer<typeof uploadContentTypeSchema>;

export const requestProfileImageUpload = async (input: {
  uploadType: ProfileUploadType;
  contentType: ProfileUploadContentType;
  fileSizeBytes: number;
}): Promise<{ signedUrl: string; publicUrl: string }> => {
  const payload = requestUploadInputSchema.parse(input);
  const response = await apiRequest<unknown, typeof payload>("/api/uploads/request", {
    method: "POST",
    body: payload,
  });

  return requestUploadResponseSchema.parse(response);
};

export const uploadImageToSignedUrl = async (input: {
  signedUrl: string;
  file: File;
  contentType: ProfileUploadContentType;
}): Promise<void> => {
  const response = await fetch(input.signedUrl, {
    method: "PUT",
    body: input.file,
    headers: {
      "content-type": input.contentType,
    },
  });

  if (!response.ok) {
    throw new Error("Could not upload image file.");
  }
};

export const confirmProfileImageUpload = async (input: {
  uploadType: ProfileUploadType;
  publicUrl: string;
}): Promise<void> => {
  const payload = confirmUploadInputSchema.parse(input);
  await apiRequest<unknown, typeof payload>("/api/uploads/confirm", {
    method: "POST",
    body: payload,
  });
};
