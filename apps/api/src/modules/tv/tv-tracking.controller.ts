import type { Request, Response } from "express";
import { sendBadRequest, sendNotFound, sendValidationError } from "../../commons/http/validation-response.helper";
import { parseTmdbIdParam } from "../../commons/validation/params.helper";
import { TvTrackingService } from "./services/tv-tracking.service";
import { TvWatchedThroughService } from "./services/tv-watched-through.service";
import {
  SeriesEpisodeParamsSchema,
  SeriesSeasonParamsSchema,
  UpdateSeasonInteractionSchema,
  SeasonReviewInputSchema,
  SeasonReviewDeleteQuerySchema,
  WatchedThroughParamsSchema,
} from "./dto/tv.dto";
import type {
  SeriesEpisodeParams,
  SeriesSeasonParams,
} from "./dto/tv.dto";

export class TvTrackingController {
  static async markWatchedThrough(req: Request<SeriesEpisodeParams>, res: Response): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    const params = WatchedThroughParamsSchema.safeParse(req.params);
    if (tmdbId === null || !params.success) {
      sendBadRequest(res, "Invalid series, season or episode");
      return;
    }

    const result = await TvWatchedThroughService.markWatchedThrough(
      req.user.id,
      tmdbId,
      params.data.seasonNumber,
      params.data.episodeNumber,
    );
    if (!result) {
      sendNotFound(res, "Series not found");
      return;
    }

    res.status(200).json(result);
  }

  static async updateSeasonInteraction(req: Request<SeriesSeasonParams>, res: Response): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const seasonParams = SeriesSeasonParamsSchema.safeParse(req.params);
    if (!seasonParams.success) {
      sendValidationError(res, seasonParams.error);
      return;
    }

    const parsed = UpdateSeasonInteractionSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await TvTrackingService.updateSeasonInteraction(
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

  static async updateEpisodeInteraction(req: Request<SeriesEpisodeParams>, res: Response): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const episodeParams = SeriesEpisodeParamsSchema.safeParse(req.params);
    if (!episodeParams.success) {
      sendValidationError(res, episodeParams.error);
      return;
    }

    const parsed = UpdateSeasonInteractionSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await TvTrackingService.updateEpisodeInteraction(
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

  static async getSeasonReview(req: Request<SeriesSeasonParams>, res: Response): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const seasonParams = SeriesSeasonParamsSchema.safeParse(req.params);
    if (!seasonParams.success) {
      sendValidationError(res, seasonParams.error);
      return;
    }

    const review = await TvTrackingService.getSeasonReview(
      req.user.id,
      tmdbId,
      seasonParams.data.seasonNumber,
    );

    res.status(200).json(review);
  }

  static async upsertSeasonReview(req: Request<SeriesSeasonParams>, res: Response): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const seasonParams = SeriesSeasonParamsSchema.safeParse(req.params);
    if (!seasonParams.success) {
      sendValidationError(res, seasonParams.error);
      return;
    }

    const parsed = SeasonReviewInputSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const review = await TvTrackingService.upsertSeasonReview(
      req.user.id,
      tmdbId,
      seasonParams.data.seasonNumber,
      parsed.data,
    );

    if (!review) {
      sendNotFound(res, "Review not found");
      return;
    }

    res.status(200).json(review);
  }

  static async deleteSeasonReview(req: Request<SeriesSeasonParams>, res: Response): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const seasonParams = SeriesSeasonParamsSchema.safeParse(req.params);
    if (!seasonParams.success) {
      sendValidationError(res, seasonParams.error);
      return;
    }

    const query = SeasonReviewDeleteQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendValidationError(res, query.error);
      return;
    }

    const deleted = await TvTrackingService.deleteSeasonReview(
      req.user.id,
      tmdbId,
      seasonParams.data.seasonNumber,
      query.data.reviewId,
    );

    if (!deleted) {
      sendNotFound(res, "Review not found");
      return;
    }

    res.status(200).json({ success: true });
  }

  static async getEpisodeReview(req: Request<SeriesEpisodeParams>, res: Response): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const episodeParams = SeriesEpisodeParamsSchema.safeParse(req.params);
    if (!episodeParams.success) {
      sendValidationError(res, episodeParams.error);
      return;
    }

    const review = await TvTrackingService.getEpisodeReview(
      req.user.id,
      tmdbId,
      episodeParams.data.seasonNumber,
      episodeParams.data.episodeNumber,
    );

    res.status(200).json(review);
  }

  static async upsertEpisodeReview(req: Request<SeriesEpisodeParams>, res: Response): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const episodeParams = SeriesEpisodeParamsSchema.safeParse(req.params);
    if (!episodeParams.success) {
      sendValidationError(res, episodeParams.error);
      return;
    }

    const parsed = SeasonReviewInputSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const review = await TvTrackingService.upsertEpisodeReview(
      req.user.id,
      tmdbId,
      episodeParams.data.seasonNumber,
      episodeParams.data.episodeNumber,
      parsed.data,
    );

    if (!review) {
      sendNotFound(res, "Review not found");
      return;
    }

    res.status(200).json(review);
  }

  static async deleteEpisodeReview(req: Request<SeriesEpisodeParams>, res: Response): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const episodeParams = SeriesEpisodeParamsSchema.safeParse(req.params);
    if (!episodeParams.success) {
      sendValidationError(res, episodeParams.error);
      return;
    }

    const query = SeasonReviewDeleteQuerySchema.safeParse(req.query);
    if (!query.success) {
      sendValidationError(res, query.error);
      return;
    }

    const deleted = await TvTrackingService.deleteEpisodeReview(
      req.user.id,
      tmdbId,
      episodeParams.data.seasonNumber,
      episodeParams.data.episodeNumber,
      query.data.reviewId,
    );

    if (!deleted) {
      sendNotFound(res, "Review not found");
      return;
    }

    res.status(200).json({ success: true });
  }
}
