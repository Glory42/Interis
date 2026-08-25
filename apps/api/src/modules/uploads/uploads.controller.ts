import type { Request, Response } from "express";
import type { UploadType } from "../../infrastructure/r2/client";
import {
  sendErrorForStatus,
  sendValidationError,
} from "../../commons/http/validation-response.helper";
import { UploadsService } from "./uploads.service";
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

    const result = await UploadsService.requestUpload(
      req.user.id,
      parsed.data.uploadType as UploadType,
      parsed.data.contentType,
      parsed.data.fileSizeBytes,
    );

    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }

    res.status(200).json({ signedUrl: result.signedUrl, publicUrl: result.publicUrl });
  }

  // POST /api/uploads/confirm
  // Step 2: After R2 upload succeeds, store the public URL in DB
  static async confirmUpload(req: Request, res: Response): Promise<void> {
    const parsed = ConfirmUploadSchema.safeParse(req.body);

    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await UploadsService.confirmUpload(
      req.user.id,
      parsed.data.uploadType,
      parsed.data.publicUrl,
    );

    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }

    res.status(200).json(result.profile);
  }
}
