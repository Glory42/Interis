import type { Context } from "hono";
import type { AppEnv } from "../../infrastructure/http/hono-context.types";
import { sendBadRequest, sendNotFound, sendValidationError } from "../../commons/http/validation-response.hono";
import { parseTmdbIdParam } from "../../commons/validation/params.helper";
import { SerialsTrackingService } from "./services/serials-tracking.service";
import {
  SerialEpisodeParamsSchema,
  SerialSeasonParamsSchema,
  UpdateSeasonInteractionSchema,
  SeasonReviewInputSchema,
} from "./dto/serials.dto";

export class SerialsTrackingController {
  static async updateSeasonInteraction(c: Context<AppEnv>): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid series ID");
    }

    const seasonParams = SerialSeasonParamsSchema.safeParse(c.req.param());
    if (!seasonParams.success) {
      return sendValidationError(c, seasonParams.error);
    }

    const parsed = UpdateSeasonInteractionSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const result = await SerialsTrackingService.updateSeasonInteraction(
      c.get("user").id,
      tmdbId,
      seasonParams.data.seasonNumber,
      parsed.data,
    );

    if (!result) {
      return sendNotFound(c, "Season or series not found");
    }

    return c.json(result, 200);
  }

  static async updateEpisodeInteraction(c: Context<AppEnv>): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid series ID");
    }

    const episodeParams = SerialEpisodeParamsSchema.safeParse(c.req.param());
    if (!episodeParams.success) {
      return sendValidationError(c, episodeParams.error);
    }

    const parsed = UpdateSeasonInteractionSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const result = await SerialsTrackingService.updateEpisodeInteraction(
      c.get("user").id,
      tmdbId,
      episodeParams.data.seasonNumber,
      episodeParams.data.episodeNumber,
      parsed.data,
    );

    if (!result) {
      return sendNotFound(c, "Episode or series not found");
    }

    return c.json(result, 200);
  }

  static async getSeasonReview(c: Context<AppEnv>): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid series ID");
    }

    const seasonParams = SerialSeasonParamsSchema.safeParse(c.req.param());
    if (!seasonParams.success) {
      return sendValidationError(c, seasonParams.error);
    }

    const review = await SerialsTrackingService.getSeasonReview(
      c.get("user").id,
      tmdbId,
      seasonParams.data.seasonNumber,
    );

    return c.json(review, 200);
  }

  static async upsertSeasonReview(c: Context<AppEnv>): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid series ID");
    }

    const seasonParams = SerialSeasonParamsSchema.safeParse(c.req.param());
    if (!seasonParams.success) {
      return sendValidationError(c, seasonParams.error);
    }

    const parsed = SeasonReviewInputSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const review = await SerialsTrackingService.upsertSeasonReview(
      c.get("user").id,
      tmdbId,
      seasonParams.data.seasonNumber,
      parsed.data,
    );

    return c.json(review, 200);
  }

  static async deleteSeasonReview(c: Context<AppEnv>): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid series ID");
    }

    const seasonParams = SerialSeasonParamsSchema.safeParse(c.req.param());
    if (!seasonParams.success) {
      return sendValidationError(c, seasonParams.error);
    }

    const deleted = await SerialsTrackingService.deleteSeasonReview(
      c.get("user").id,
      tmdbId,
      seasonParams.data.seasonNumber,
    );

    if (!deleted) {
      return sendNotFound(c, "Review not found");
    }

    return c.json({ success: true }, 200);
  }

  static async getEpisodeReview(c: Context<AppEnv>): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid series ID");
    }

    const episodeParams = SerialEpisodeParamsSchema.safeParse(c.req.param());
    if (!episodeParams.success) {
      return sendValidationError(c, episodeParams.error);
    }

    const review = await SerialsTrackingService.getEpisodeReview(
      c.get("user").id,
      tmdbId,
      episodeParams.data.seasonNumber,
      episodeParams.data.episodeNumber,
    );

    return c.json(review, 200);
  }

  static async upsertEpisodeReview(c: Context<AppEnv>): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid series ID");
    }

    const episodeParams = SerialEpisodeParamsSchema.safeParse(c.req.param());
    if (!episodeParams.success) {
      return sendValidationError(c, episodeParams.error);
    }

    const parsed = SeasonReviewInputSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const review = await SerialsTrackingService.upsertEpisodeReview(
      c.get("user").id,
      tmdbId,
      episodeParams.data.seasonNumber,
      episodeParams.data.episodeNumber,
      parsed.data,
    );

    return c.json(review, 200);
  }

  static async deleteEpisodeReview(c: Context<AppEnv>): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid series ID");
    }

    const episodeParams = SerialEpisodeParamsSchema.safeParse(c.req.param());
    if (!episodeParams.success) {
      return sendValidationError(c, episodeParams.error);
    }

    const deleted = await SerialsTrackingService.deleteEpisodeReview(
      c.get("user").id,
      tmdbId,
      episodeParams.data.seasonNumber,
      episodeParams.data.episodeNumber,
    );

    if (!deleted) {
      return sendNotFound(c, "Review not found");
    }

    return c.json({ success: true }, 200);
  }
}
