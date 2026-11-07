import type { Request, Response } from "express";
import { resolveViewerUserIdFromHeaders } from "../../commons/auth/session-resolver.helper";
import { sendBadRequest, sendNotFound, sendValidationError } from "../../commons/http/validation-response.helper";
import { parseTmdbIdParam } from "../../commons/validation/params.helper";
import { TvService } from "./tv.service";
import type {
  SeriesDetailQuery,
  SearchTvQuery,
  SeriesArchiveQuery,
  SeriesParams,
  SeriesSeasonParams,
} from "./dto/tv.dto";
import {
  CreateSeriesLogSchema,
  DeleteSeriesLogQuerySchema,
  normalizeSeriesArchiveQuery,
  normalizeSeriesDetailQuery,
  normalizeSeriesLogsQuery,
  SearchTvQuerySchema,
  SeriesSeasonParamsSchema,
  UpdateSeriesInteractionSchema,
  UpdateSeriesLogSchema,
} from "./dto/tv.dto";

export class TvController {
  static async search(
    req: Request<{}, {}, {}, SearchTvQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = SearchTvQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const series = await TvService.search(parsed.data.query);
    res.status(200).json(series);
  }

  static async getByTmdbId(
    req: Request<SeriesParams>,
    res: Response,
  ): Promise<void> {
    // Contract: return normalized cached tv_series entity only.
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const series = await TvService.findForRead(tmdbId);
    if (!series) {
      sendNotFound(res, "Series not found");
      return;
    }

    res.status(200).json(series);
  }

  static async getDetailByTmdbId(
    req: Request<SeriesParams, {}, {}, SeriesDetailQuery>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);
    const { reviewsSort, reviewsPage, reviewsLimit } = normalizeSeriesDetailQuery(req.query);

    const detail = await TvService.getDetail({
      tmdbId,
      viewerUserId,
      reviewsSort,
      reviewsPage,
      reviewsLimit,
    });

    if (!detail) {
      sendNotFound(res, "Series not found");
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(detail);
  }

  static async getReviews(
    req: Request<SeriesParams, {}, {}, SeriesDetailQuery>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);
    const { reviewsSort, reviewsPage, reviewsLimit } = normalizeSeriesDetailQuery(req.query);

    const reviews = await TvService.getReviews({
      tmdbId,
      viewerUserId,
      sort: reviewsSort,
      page: reviewsPage,
      limit: reviewsLimit,
    });

    if (!reviews) {
      sendNotFound(res, "Series not found");
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(reviews);
  }

  static async getInteractionByTmdbId(
    req: Request<SeriesParams>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const state = await TvService.getInteraction(req.user.id, tmdbId);
    if (!state) {
      sendNotFound(res, "Series not found");
      return;
    }

    res.status(200).json(state);
  }

  static async updateInteractionByTmdbId(
    req: Request<SeriesParams>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const parsed = UpdateSeriesInteractionSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await TvService.updateInteraction(
      req.user.id,
      tmdbId,
      parsed.data,
    );

    if (!result) {
      sendNotFound(res, "Series not found");
      return;
    }

    res.status(200).json(result);
  }

  static async createLogByTmdbId(
    req: Request<SeriesParams>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const parsed = CreateSeriesLogSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const created = await TvService.createLog(req.user.id, tmdbId, parsed.data);
    if (!created) {
      sendNotFound(res, "Series not found");
      return;
    }

    res.status(201).json(created);
  }

  static async getSeasonByTmdbId(
    req: Request<SeriesSeasonParams>,
    res: Response,
  ): Promise<void> {
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

    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);

    const seasonDetail = await TvService.getSeasonDetail({
      tmdbId,
      seasonNumber: seasonParams.data.seasonNumber,
      viewerUserId,
    });

    if (!seasonDetail) {
      sendNotFound(res, "Season not found");
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(seasonDetail);
  }

  static async getArchive(
    req: Request<{}, {}, {}, SeriesArchiveQuery>,
    res: Response,
  ): Promise<void> {
    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);

    const archive = await TvService.getArchive({
      ...normalizeSeriesArchiveQuery(req.query),
      viewerUserId,
    });

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(archive);
  }

  static async getTrending(_req: Request, res: Response): Promise<void> {
    const series = await TvService.getTrending();
    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).json(series);
  }

  static async getRecent(_req: Request, res: Response): Promise<void> {
    const series = await TvService.getRecent();
    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).json(series);
  }

  static async getLogsByTmdbId(
    req: Request<SeriesParams>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const { limit, offset } = normalizeSeriesLogsQuery(req.query);
    const logs = await TvService.getLogs(tmdbId, limit, offset);
    if (logs === null) {
      sendNotFound(res, "Series not found");
      return;
    }

    res.status(200).json(logs);
  }

  static async getMyLogs(req: Request, res: Response): Promise<void> {
    const { limit, offset } = normalizeSeriesLogsQuery(req.query);
    const logs = await TvService.getMyLogs(req.user.id, limit, offset);
    res.status(200).json(logs);
  }

  static async updateLog(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const parsed = UpdateSeriesLogSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const updated = await TvService.updateLog(req.params.id, req.user.id, parsed.data);
    if (!updated) {
      sendNotFound(res, "Serial log not found");
      return;
    }

    res.status(200).json(updated);
  }

  static async deleteLog(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const parsed = DeleteSeriesLogQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const deleted = await TvService.deleteLog(req.params.id, req.user.id, parsed.data);
    if (!deleted) {
      sendNotFound(res, "Serial log not found");
      return;
    }

    res.status(200).json({ success: true, unwatched: deleted.unwatched });
  }
}
