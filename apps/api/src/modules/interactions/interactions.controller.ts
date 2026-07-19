import type { Context } from "hono";
import type { AppEnv } from "../../infrastructure/http/hono-context.types";
import {
  sendBadRequest,
  sendValidationError,
} from "../../commons/http/validation-response.hono";
import { parseTmdbIdParam } from "../../commons/validation/params.helper";
import { InteractionsService } from "./interactions.service";
import { UpdateInteractionSchema } from "./dto/interactions.dto";

export class InteractionsController {
  // GET /api/interactions/:tmdbId
  static async get(c: Context<AppEnv>): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid tmdbId");
    }

    const state = await InteractionsService.get(c.get("user").id, tmdbId);
    return c.json(state, 200);
  }

  // PUT /api/interactions/:tmdbId
  static async update(c: Context<AppEnv>): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid tmdbId");
    }

    const parsed = UpdateInteractionSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const result = await InteractionsService.update(c.get("user").id, tmdbId, parsed.data);
    return c.json(result, 200);
  }
}
