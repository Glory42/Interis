import type { Request, Response } from "express";
import { sendBadRequest, sendNotFound, sendValidationError } from "../../commons/http/validation-response.helper";
import { parseTmdbIdParam } from "../../commons/validation/params.helper";
import { SerialsTrackingService } from "./services/serials-tracking.service";
import {
  SerialEpisodeParamsSchema,
  SerialSeasonParamsSchema,
  UpdateSeasonInteractionSchema,
  SeasonReviewInputSchema,
} from "./dto/serials.dto";
import type {
  SerialEpisodeParams,
  SerialSeasonParams,
} from "./dto/serials.dto";

export class SerialsTrackingController {
  static async updateSeasonInteraction(req: Request<SerialSeasonParams>, res: Response): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const seasonParams = SerialSeasonParamsSchema.safeParse(req.params);
    if (!seasonParams.success) {
      sendValidationError(res, seasonParams.error);
      return;
    }

    const parsed = UpdateSeasonInteractionSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await SerialsTrackingService.updateSeasonInteraction(
      req.user.id,
      tmdbId,
      seasonParams.data.seasonNumber,
      parsed.data,
    );

    if (!result) {
      sendNotFound(res, "Season or series not found");
      return;
    }

    res.status(200).json(result);
  }

  static async updateEpisodeInteraction(req: Request<SerialEpisodeParams>, res: Response): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const episodeParams = SerialEpisodeParamsSchema.safeParse(req.params);
    if (!episodeParams.success) {
      sendValidationError(res, episodeParams.error);
      return;
    }

    const parsed = UpdateSeasonInteractionSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await SerialsTrackingService.updateEpisodeInteraction(
      req.user.id,
      tmdbId,
      episodeParams.data.seasonNumber,
      episodeParams.data.episodeNumber,
      parsed.data,
    );

    if (!result) {
      sendNotFound(res, "Episode or series not found");
      return;
    }

    res.status(200).json(result);
  }

  static async getSeasonReview(req: Request<SerialSeasonParams>, res: Response): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const seasonParams = SerialSeasonParamsSchema.safeParse(req.params);
    if (!seasonParams.success) {
      sendValidationError(res, seasonParams.error);
      return;
    }

    const review = await SerialsTrackingService.getSeasonReview(
      req.user.id,
      tmdbId,
      seasonParams.data.seasonNumber,
    );

    res.status(200).json(review);
  }

  static async upsertSeasonReview(req: Request<SerialSeasonParams>, res: Response): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const seasonParams = SerialSeasonParamsSchema.safeParse(req.params);
    if (!seasonParams.success) {
      sendValidationError(res, seasonParams.error);
      return;
    }

    const parsed = SeasonReviewInputSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const review = await SerialsTrackingService.upsertSeasonReview(
      req.user.id,
      tmdbId,
      seasonParams.data.seasonNumber,
      parsed.data,
    );

    res.status(200).json(review);
  }

  static async deleteSeasonReview(req: Request<SerialSeasonParams>, res: Response): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const seasonParams = SerialSeasonParamsSchema.safeParse(req.params);
    if (!seasonParams.success) {
      sendValidationError(res, seasonParams.error);
      return;
    }

    const deleted = await SerialsTrackingService.deleteSeasonReview(
      req.user.id,
      tmdbId,
      seasonParams.data.seasonNumber,
    );

    if (!deleted) {
      sendNotFound(res, "Review not found");
      return;
    }

    res.status(200).json({ success: true });
  }

  static async getEpisodeReview(req: Request<SerialEpisodeParams>, res: Response): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const episodeParams = SerialEpisodeParamsSchema.safeParse(req.params);
    if (!episodeParams.success) {
      sendValidationError(res, episodeParams.error);
      return;
    }

    const review = await SerialsTrackingService.getEpisodeReview(
      req.user.id,
      tmdbId,
      episodeParams.data.seasonNumber,
      episodeParams.data.episodeNumber,
    );

    res.status(200).json(review);
  }

  static async upsertEpisodeReview(req: Request<SerialEpisodeParams>, res: Response): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const episodeParams = SerialEpisodeParamsSchema.safeParse(req.params);
    if (!episodeParams.success) {
      sendValidationError(res, episodeParams.error);
      return;
    }

    const parsed = SeasonReviewInputSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const review = await SerialsTrackingService.upsertEpisodeReview(
      req.user.id,
      tmdbId,
      episodeParams.data.seasonNumber,
      episodeParams.data.episodeNumber,
      parsed.data,
    );

    res.status(200).json(review);
  }

  static async deleteEpisodeReview(req: Request<SerialEpisodeParams>, res: Response): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const episodeParams = SerialEpisodeParamsSchema.safeParse(req.params);
    if (!episodeParams.success) {
      sendValidationError(res, episodeParams.error);
      return;
    }

    const deleted = await SerialsTrackingService.deleteEpisodeReview(
      req.user.id,
      tmdbId,
      episodeParams.data.seasonNumber,
      episodeParams.data.episodeNumber,
    );

    if (!deleted) {
      sendNotFound(res, "Review not found");
      return;
    }

    res.status(200).json({ success: true });
  }
}
