import type { Context } from "hono";
import type { AppEnv } from "../../infrastructure/http/hono-context.types";
import {
  generateUploadUrl,
  isR2ConfigurationError,
  isOwnedUploadPublicUrl,
  type UploadType,
} from "../../infrastructure/r2/client";
import {
  sendBadRequest,
  sendServiceUnavailable,
  sendValidationError,
} from "../../commons/http/validation-response.hono";
import { logger } from "../../commons/utils/logger";
import { UsersService } from "../users/users.service";
import { ConfirmUploadSchema, RequestUploadSchema } from "./dto/uploads.dto";

export class UploadsController {
  // POST /api/uploads/request
  // Step 1: Get a presigned URL — frontend uses it to PUT directly to R2
  static async requestUpload(c: Context<AppEnv>): Promise<Response> {
    const parsed = RequestUploadSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    try {
      const { signedUrl, publicUrl } = await generateUploadUrl(
        c.get("user").id,
        parsed.data.uploadType as UploadType,
        parsed.data.contentType,
        parsed.data.fileSizeBytes,
      );

      return c.json({ signedUrl, publicUrl }, 200);
    } catch (error) {
      if (isR2ConfigurationError(error)) {
        logger.error(error, "R2 uploads are not configured correctly");
        return sendServiceUnavailable(
          c,
          "Image uploads are temporarily unavailable. Please configure R2 storage.",
        );
      }

      if (error instanceof Error) {
        if (error.message.startsWith("Unsupported file type")) {
          return sendBadRequest(c, error.message);
        }

        if (error.message.startsWith("File too large")) {
          return sendBadRequest(c, error.message);
        }
      }

      throw error;
    }
  }

  // POST /api/uploads/confirm
  // Step 2: After R2 upload succeeds, store the public URL in DB
  static async confirmUpload(c: Context<AppEnv>): Promise<Response> {
    const parsed = ConfirmUploadSchema.safeParse(await c.req.json());

    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    if (!isOwnedUploadPublicUrl(c.get("user").id, parsed.data.uploadType, parsed.data.publicUrl)) {
      return sendBadRequest(c, "Invalid upload URL. Please request a new signed upload URL.");
    }

    const updated = await UsersService.updateProfile(c.get("user").id, {
      avatarUrl: parsed.data.publicUrl,
    });

    return c.json(updated, 200);
  }
}
