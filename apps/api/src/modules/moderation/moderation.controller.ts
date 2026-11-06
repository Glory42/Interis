import type { Request, Response } from "express";
import {
  sendErrorForStatus,
  sendValidationError,
} from "../../commons/http/validation-response.helper";
import { ModerationService } from "./services/moderation.service";
import {
  MODERATION_LIST_DEFAULT_LIMIT,
  ModerationListQuerySchema,
  type UsernameParams,
} from "./dto/moderation.dto";

export class ModerationController {
  static async block(req: Request<UsernameParams>, res: Response): Promise<void> {
    const result = await ModerationService.blockUser(req.user.id, req.params.username);
    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }
    res.status(200).json(result);
  }

  static async unblock(req: Request<UsernameParams>, res: Response): Promise<void> {
    await ModerationService.unblockUser(req.user.id, req.params.username);
    res.status(200).json({ success: true });
  }

  static async mute(req: Request<UsernameParams>, res: Response): Promise<void> {
    const result = await ModerationService.muteUser(req.user.id, req.params.username);
    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }
    res.status(200).json(result);
  }

  static async unmute(req: Request<UsernameParams>, res: Response): Promise<void> {
    await ModerationService.unmuteUser(req.user.id, req.params.username);
    res.status(200).json({ success: true });
  }

  static async getRelationshipState(
    req: Request<UsernameParams>,
    res: Response,
  ): Promise<void> {
    const result = await ModerationService.getRelationshipState(
      req.user.id,
      req.params.username,
    );
    if ("error" in result) {
      sendErrorForStatus(res, result.status, result.error);
      return;
    }
    res.status(200).json(result);
  }

  static async getBlocked(req: Request, res: Response): Promise<void> {
    const parsed = ModerationListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const blocked = await ModerationService.listBlocked(
      req.user.id,
      parsed.data.limit ?? MODERATION_LIST_DEFAULT_LIMIT,
      parsed.data.offset ?? 0,
    );
    res.status(200).json(blocked);
  }

  static async getMuted(req: Request, res: Response): Promise<void> {
    const parsed = ModerationListQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const muted = await ModerationService.listMuted(
      req.user.id,
      parsed.data.limit ?? MODERATION_LIST_DEFAULT_LIMIT,
      parsed.data.offset ?? 0,
    );
    res.status(200).json(muted);
  }
}
