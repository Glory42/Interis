import {
  deleteAllUserUploads,
  deleteObject,
  generateUploadUrl,
  isR2ConfigurationError,
  isOwnedUploadPublicUrl,
  ownedUploadKeyFromPublicUrl,
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
    | { error: string; status: 400 | 503 }
    | { success: true; profile: Awaited<ReturnType<typeof UsersService.updateProfile>> }
  > {
    let owned: boolean;
    try {
      owned = isOwnedUploadPublicUrl(userId, uploadType, publicUrl);
    } catch (error) {
      if (isR2ConfigurationError(error)) {
        logger.error(error, "R2 uploads are not configured correctly");
        return {
          error: "Image uploads are temporarily unavailable. Please configure R2 storage.",
          status: 503,
        };
      }

      throw error;
    }

    if (!owned) {
      return {
        error: "Invalid upload URL. Please request a new signed upload URL.",
        status: 400,
      };
    }

    const previous = await UsersService.findById(userId);
    const profile = await UsersService.updateProfile(userId, { avatarUrl: publicUrl });
    if (previous?.avatarUrl && previous.avatarUrl !== publicUrl) {
      await UploadsService.deleteReplacedUpload(userId, uploadType, previous.avatarUrl);
    }

    return { success: true, profile };
  }

  // Best-effort: the new avatar is already saved, so a failed delete only
  // leaves an orphan behind (#101).
  private static async deleteReplacedUpload(
    userId: string,
    uploadType: UploadType,
    previousUrl: string,
  ): Promise<void> {
    const key = ownedUploadKeyFromPublicUrl(userId, uploadType, previousUrl);
    if (!key) return;

    try {
      await deleteObject(key);
    } catch (error) {
      logger.warn({ err: error, key }, "Failed to delete a replaced upload");
    }
  }

  // Best-effort, after the account is gone: removes every upload the user
  // made, including ones requested but never confirmed (#101).
  static async deleteAllForUser(userId: string): Promise<void> {
    try {
      await deleteAllUserUploads(userId, "avatar");
    } catch (error) {
      if (isR2ConfigurationError(error)) return;
      logger.warn({ err: error, userId }, "Failed to delete a deleted account's uploads");
    }
  }
}
