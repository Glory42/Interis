import type { Request, Response } from "express";
import {
  sendBadRequest,
  sendValidationError,
} from "../../commons/http/validation-response.helper";
import { parseTmdbIdParam } from "../../commons/validation/params.helper";
import { InteractionsService } from "./interactions.service";
import { UpdateInteractionSchema } from "./dto/interactions.dto";

export class InteractionsController {
  // GET /api/interactions/:tmdbId
  static async get(
    req: Request<{ tmdbId: string }>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid tmdbId");
      return;
    }

    const state = await InteractionsService.get(req.user.id, tmdbId);
    res.status(200).json(state);
  }

  // PUT /api/interactions/:tmdbId
  static async update(
    req: Request<{ tmdbId: string }>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid tmdbId");
      return;
    }

    const parsed = UpdateInteractionSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await InteractionsService.update(
      req.user.id,
      tmdbId,
      parsed.data,
    );
    res.status(200).json(result);
  }
}
