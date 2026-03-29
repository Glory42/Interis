import type { Request, Response } from "express";
import { InteractionsService } from "./interactions.service";
import { UpdateInteractionSchema } from "./dto/interactions.dto";

export class InteractionsController {
  // GET /api/interactions/:tmdbId
  static async get(
    req: Request<{ tmdbId: string }>,
    res: Response,
  ): Promise<void> {
    const tmdbId = Number.parseInt(req.params.tmdbId, 10);
    if (Number.isNaN(tmdbId)) {
      res.status(400).json({ error: "Invalid tmdbId" });
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
    const tmdbId = Number.parseInt(req.params.tmdbId, 10);
    if (Number.isNaN(tmdbId)) {
      res.status(400).json({ error: "Invalid tmdbId" });
      return;
    }

    const parsed = UpdateInteractionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.flatten() });
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
