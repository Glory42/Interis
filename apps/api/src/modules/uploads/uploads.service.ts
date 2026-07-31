import {
  generateUploadUrl,
  isR2ConfigurationError,
  isOwnedUploadPublicUrl,
  type UploadType,
} from "../../infrastructure/r2/client";
import { logger } from "../../commons/utils/logger";
import { UsersService } from "../users/users.service";

export class UploadsService {
  static async requestUpload(
    userId: string,
    uploadType: UploadType,
    contentType: string,
    fileSizeBytes: number,
  ): Promise<
    | { error: string; status: 400 | 503 }
    | { success: true; signedUrl: string; publicUrl: string }
  > {
    try {
      const { signedUrl, publicUrl } = await generateUploadUrl(
        userId,
        uploadType,
        contentType,
        fileSizeBytes,
      );

      return { success: true, signedUrl, publicUrl };
    } catch (error) {
      if (isR2ConfigurationError(error)) {
        logger.error(error, "R2 uploads are not configured correctly");
        return {
          error: "Image uploads are temporarily unavailable. Please configure R2 storage.",
          status: 503,
        };
      }

      if (error instanceof Error) {
        if (error.message.startsWith("Unsupported file type")) {
          return { error: error.message, status: 400 };
        }

        if (error.message.startsWith("File too large")) {
          return { error: error.message, status: 400 };
        }
      }

      throw error;
    }
  }

  static async confirmUpload(
    userId: string,
    uploadType: UploadType,
    publicUrl: string,
  ): Promise<
    | { error: string; status: 400 }
    | { success: true; profile: Awaited<ReturnType<typeof UsersService.updateProfile>> }
  > {
    if (!isOwnedUploadPublicUrl(userId, uploadType, publicUrl)) {
      return {
        error: "Invalid upload URL. Please request a new signed upload URL.",
        status: 400,
      };
    }

    const profile = await UsersService.updateProfile(userId, { avatarUrl: publicUrl });

    return { success: true, profile };
  }
}
