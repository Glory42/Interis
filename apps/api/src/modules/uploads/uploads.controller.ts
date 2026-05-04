import type { Request, Response } from "express";
import {
  generateUploadUrl,
  isR2ConfigurationError,
  isOwnedUploadPublicUrl,
  type UploadType,
} from "../../infrastructure/r2/client";
import { sendValidationError } from "../../commons/http/validation-response.helper";
import { logger } from "../../commons/utils/logger";
import { UsersService } from "../users/users.service";
import { ConfirmUploadSchema, RequestUploadSchema } from "./dto/uploads.dto";

export class UploadsController {
  // POST /api/uploads/request
  // Step 1: Get a presigned URL — frontend uses it to PUT directly to R2
  static async requestUpload(req: Request, res: Response): Promise<void> {
    const parsed = RequestUploadSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    try {
      const { signedUrl, publicUrl } = await generateUploadUrl(
        req.user.id,
        parsed.data.uploadType as UploadType,
        parsed.data.contentType,
        parsed.data.fileSizeBytes,
      );

      res.status(200).json({ signedUrl, publicUrl });
    } catch (error) {
      if (isR2ConfigurationError(error)) {
        logger.error(error, "R2 uploads are not configured correctly");
        res.status(503).json({
          error:
            "Image uploads are temporarily unavailable. Please configure R2 storage.",
        });
        return;
      }

      if (error instanceof Error) {
        if (error.message.startsWith("Unsupported file type")) {
          res.status(400).json({ error: error.message });
          return;
        }

        if (error.message.startsWith("File too large")) {
          res.status(400).json({ error: error.message });
          return;
        }
      }

      throw error;
    }
  }

  // POST /api/uploads/confirm
  // Step 2: After R2 upload succeeds, store the public URL in DB
  static async confirmUpload(req: Request, res: Response): Promise<void> {
    const parsed = ConfirmUploadSchema.safeParse(req.body);

    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    if (
      !isOwnedUploadPublicUrl(
        req.user.id,
        parsed.data.uploadType,
        parsed.data.publicUrl,
      )
    ) {
      res.status(400).json({
        error: "Invalid upload URL. Please request a new signed upload URL.",
      });
      return;
    }

    const updated = await UsersService.updateProfile(req.user.id, {
      avatarUrl: parsed.data.publicUrl,
    });

    res.status(200).json(updated);
  }
}
