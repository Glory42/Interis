import type { Request, Response } from "express";
import { resolveViewerUserIdFromHeaders } from "../../commons/auth/session-resolver.helper";
import { sendBadRequest, sendNotFound, sendValidationError } from "../../commons/http/validation-response.helper";
import { parseTmdbIdParam } from "../../commons/validation/params.helper";
import { SerialsService } from "./serials.service";
import type {
  SerialDetailQuery,
  SearchSerialsQuery,
  SerialArchiveQuery,
  SerialParams,
  SerialSeasonParams,
} from "./dto/serials.dto";
import {
  CreateSerialLogSchema,
  normalizeSerialArchiveQuery,
  normalizeSerialDetailQuery,
  normalizeSerialLogsQuery,
  SearchSerialsQuerySchema,
  SerialSeasonParamsSchema,
  UpdateSerialInteractionSchema,
  UpdateSerialLogSchema,
} from "./dto/serials.dto";

export class SerialsController {
  static async search(
    req: Request<{}, {}, {}, SearchSerialsQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = SearchSerialsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const series = await SerialsService.search(parsed.data.query);
    res.status(200).json(series);
  }

  static async getByTmdbId(
    req: Request<SerialParams>,
    res: Response,
  ): Promise<void> {
    // Contract: return normalized cached tv_series entity only.
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const series = await SerialsService.findOrCreate(tmdbId);
    if (!series) {
      sendNotFound(res, "Series not found");
      return;
    }

    res.status(200).json(series);
  }

  static async getDetailByTmdbId(
    req: Request<SerialParams, {}, {}, SerialDetailQuery>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);

    const detail = await SerialsService.getDetail({
      tmdbId,
      viewerUserId,
      reviewsSort: normalizeSerialDetailQuery(req.query).reviewsSort,
    });

    if (!detail) {
      sendNotFound(res, "Series not found");
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(detail);
  }

  static async getInteractionByTmdbId(
    req: Request<SerialParams>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const state = await SerialsService.getInteraction(req.user.id, tmdbId);
    if (!state) {
      sendNotFound(res, "Series not found");
      return;
    }

    res.status(200).json(state);
  }

  static async updateInteractionByTmdbId(
    req: Request<SerialParams>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const parsed = UpdateSerialInteractionSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const result = await SerialsService.updateInteraction(
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
    req: Request<SerialParams>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const parsed = CreateSerialLogSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const created = await SerialsService.createLog(req.user.id, tmdbId, parsed.data);
    if (!created) {
      sendNotFound(res, "Series not found");
      return;
    }

    res.status(201).json(created);
  }

  static async getSeasonByTmdbId(
    req: Request<SerialSeasonParams>,
    res: Response,
  ): Promise<void> {
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

    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);

    const seasonDetail = await SerialsService.getSeasonDetail({
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
    req: Request<{}, {}, {}, SerialArchiveQuery>,
    res: Response,
  ): Promise<void> {
    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);

    const archive = await SerialsService.getArchive({
      ...normalizeSerialArchiveQuery(req.query),
      viewerUserId,
    });

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(archive);
  }

  static async getTrending(_req: Request, res: Response): Promise<void> {
    const series = await SerialsService.getTrending();
    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).json(series);
  }

  static async getRecent(_req: Request, res: Response): Promise<void> {
    const series = await SerialsService.getRecent();
    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).json(series);
  }

  static async getLogsByTmdbId(
    req: Request<SerialParams>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid series ID");
      return;
    }

    const { limit, offset } = normalizeSerialLogsQuery(req.query);
    const logs = await SerialsService.getLogs(tmdbId, limit, offset);
    if (logs === null) {
      sendNotFound(res, "Series not found");
      return;
    }

    res.status(200).json(logs);
  }

  static async getMyLogs(req: Request, res: Response): Promise<void> {
    const { limit, offset } = normalizeSerialLogsQuery(req.query);
    const logs = await SerialsService.getMyLogs(req.user.id, limit, offset);
    res.status(200).json(logs);
  }

  static async updateLog(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const parsed = UpdateSerialLogSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const updated = await SerialsService.updateLog(req.params.id, req.user.id, parsed.data);
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
    const deleted = await SerialsService.deleteLog(req.params.id, req.user.id);
    if (!deleted) {
      sendNotFound(res, "Serial log not found");
      return;
    }

    res.status(200).json({ success: true });
  }
}
