import type { Context } from "hono";
import type { AppEnv } from "../../infrastructure/http/hono-context.types";
import { sendErrorForStatus } from "../../commons/http/validation-response.hono";
import { ModerationService } from "./services/moderation.service";

export class ModerationController {
  static async block(c: Context<AppEnv>): Promise<Response> {
    const result = await ModerationService.blockUser(
      c.get("user").id,
      c.req.param("username") as string,
    );
    if ("error" in result) {
      return sendErrorForStatus(c, result.status, result.error);
    }
    return c.json(result, 200);
  }

  static async unblock(c: Context<AppEnv>): Promise<Response> {
    await ModerationService.unblockUser(c.get("user").id, c.req.param("username") as string);
    return c.json({ success: true }, 200);
  }

  static async mute(c: Context<AppEnv>): Promise<Response> {
    const result = await ModerationService.muteUser(
      c.get("user").id,
      c.req.param("username") as string,
    );
    if ("error" in result) {
      return sendErrorForStatus(c, result.status, result.error);
    }
    return c.json(result, 200);
  }

  static async unmute(c: Context<AppEnv>): Promise<Response> {
    await ModerationService.unmuteUser(c.get("user").id, c.req.param("username") as string);
    return c.json({ success: true }, 200);
  }

  static async getRelationshipState(c: Context<AppEnv>): Promise<Response> {
    const result = await ModerationService.getRelationshipState(
      c.get("user").id,
      c.req.param("username") as string,
    );
    if ("error" in result) {
      return sendErrorForStatus(c, result.status, result.error);
    }
    return c.json(result, 200);
  }

  static async getBlocked(c: Context<AppEnv>): Promise<Response> {
    const blocked = await ModerationService.listBlocked(c.get("user").id);
    return c.json(blocked, 200);
  }

  static async getMuted(c: Context<AppEnv>): Promise<Response> {
    const muted = await ModerationService.listMuted(c.get("user").id);
    return c.json(muted, 200);
  }
}
