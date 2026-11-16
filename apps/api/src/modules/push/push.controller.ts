import type { Request, Response } from "express";
import {
  sendServiceUnavailable,
  sendValidationError,
} from "../../commons/http/validation-response.helper";
import { PushService } from "./push.service";
import {
  SubscribeBodySchema,
  UnsubscribeBodySchema,
  UpdatePreferencesBodySchema,
} from "./dto/push.dto";

export class PushController {
  static async getPublicKey(_req: Request, res: Response): Promise<void> {
    res.status(200).json(PushService.getPublicKey());
  }

  static async subscribe(req: Request, res: Response): Promise<void> {
    if (!PushService.isEnabled()) {
      sendServiceUnavailable(res, "Push notifications are not configured");
      return;
    }

    const parsed = SubscribeBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    await PushService.subscribe(req.user.id, parsed.data, req.get("user-agent"));
    res.status(200).json({ success: true });
  }

  // Works even with push disabled, so a device can always be cleaned up.
  static async unsubscribe(req: Request, res: Response): Promise<void> {
    const parsed = UnsubscribeBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    await PushService.unsubscribe(req.user.id, parsed.data.endpoint);
    res.status(200).json({ success: true });
  }

  static async getPreferences(req: Request, res: Response): Promise<void> {
    res.status(200).json(await PushService.getPreferences(req.user.id));
  }

  static async updatePreferences(req: Request, res: Response): Promise<void> {
    const parsed = UpdatePreferencesBodySchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    res.status(200).json(await PushService.updatePreferences(req.user.id, parsed.data));
  }
}
