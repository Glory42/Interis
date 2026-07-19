import type { Context } from "hono";
import type { AppEnv } from "../../infrastructure/http/hono-context.types";
import { resolveViewerUserIdFromHonoContext } from "../../commons/auth/session-resolver.hono";
import { sendBadRequest, sendNotFound, sendValidationError } from "../../commons/http/validation-response.hono";
import { parseTmdbIdParam } from "../../commons/validation/params.helper";
import { SerialsService } from "./serials.service";
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
  static async search(c: Context<AppEnv>): Promise<Response> {
    const parsed = SearchSerialsQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const series = await SerialsService.search(parsed.data.query);
    return c.json(series, 200);
  }

  static async getByTmdbId(c: Context<AppEnv>): Promise<Response> {
    // Contract: return normalized cached tv_series entity only.
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid series ID");
    }

    const series = await SerialsService.findOrCreate(tmdbId);
    if (!series) {
      return sendNotFound(c, "Series not found");
    }

    return c.json(series, 200);
  }

  static async getDetailByTmdbId(c: Context<AppEnv>): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid series ID");
    }

    const viewerUserId = await resolveViewerUserIdFromHonoContext(c);

    const detail = await SerialsService.getDetail({
      tmdbId,
      viewerUserId,
      reviewsSort: normalizeSerialDetailQuery(c.req.query()).reviewsSort,
    });

    if (!detail) {
      return sendNotFound(c, "Series not found");
    }

    c.header("Cache-Control", "no-store");
    return c.json(detail, 200);
  }

  static async getInteractionByTmdbId(c: Context<AppEnv>): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid series ID");
    }

    const state = await SerialsService.getInteraction(c.get("user").id, tmdbId);
    if (!state) {
      return sendNotFound(c, "Series not found");
    }

    return c.json(state, 200);
  }

  static async updateInteractionByTmdbId(c: Context<AppEnv>): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid series ID");
    }

    const parsed = UpdateSerialInteractionSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const result = await SerialsService.updateInteraction(
      c.get("user").id,
      tmdbId,
      parsed.data,
    );

    if (!result) {
      return sendNotFound(c, "Series not found");
    }

    return c.json(result, 200);
  }

  static async createLogByTmdbId(c: Context<AppEnv>): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid series ID");
    }

    const parsed = CreateSerialLogSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const created = await SerialsService.createLog(c.get("user").id, tmdbId, parsed.data);
    if (!created) {
      return sendNotFound(c, "Series not found");
    }

    return c.json(created, 201);
  }

  static async getSeasonByTmdbId(c: Context<AppEnv>): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid series ID");
    }

    const seasonParams = SerialSeasonParamsSchema.safeParse(c.req.param());
    if (!seasonParams.success) {
      return sendValidationError(c, seasonParams.error);
    }

    const viewerUserId = await resolveViewerUserIdFromHonoContext(c);

    const seasonDetail = await SerialsService.getSeasonDetail({
      tmdbId,
      seasonNumber: seasonParams.data.seasonNumber,
      viewerUserId,
    });

    if (!seasonDetail) {
      return sendNotFound(c, "Season not found");
    }

    c.header("Cache-Control", "no-store");
    return c.json(seasonDetail, 200);
  }

  static async getArchive(c: Context<AppEnv>): Promise<Response> {
    const viewerUserId = await resolveViewerUserIdFromHonoContext(c);

    const archive = await SerialsService.getArchive({
      ...normalizeSerialArchiveQuery(c.req.query()),
      viewerUserId,
    });

    c.header("Cache-Control", "no-store");
    return c.json(archive, 200);
  }

  static async getTrending(c: Context<AppEnv>): Promise<Response> {
    const series = await SerialsService.getTrending();
    c.header("Cache-Control", "public, max-age=300");
    return c.json(series, 200);
  }

  static async getRecent(c: Context<AppEnv>): Promise<Response> {
    const series = await SerialsService.getRecent();
    c.header("Cache-Control", "public, max-age=300");
    return c.json(series, 200);
  }

  static async getLogsByTmdbId(c: Context<AppEnv>): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid series ID");
    }

    const { limit, offset } = normalizeSerialLogsQuery(c.req.query());
    const logs = await SerialsService.getLogs(tmdbId, limit, offset);
    if (logs === null) {
      return sendNotFound(c, "Series not found");
    }

    return c.json(logs, 200);
  }

  static async getMyLogs(c: Context<AppEnv>): Promise<Response> {
    const { limit, offset } = normalizeSerialLogsQuery(c.req.query());
    const logs = await SerialsService.getMyLogs(c.get("user").id, limit, offset);
    return c.json(logs, 200);
  }

  static async updateLog(c: Context<AppEnv>): Promise<Response> {
    const parsed = UpdateSerialLogSchema.safeParse(await c.req.json());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const updated = await SerialsService.updateLog(
      c.req.param("id") as string,
      c.get("user").id,
      parsed.data,
    );
    if (!updated) {
      return sendNotFound(c, "Serial log not found");
    }

    return c.json(updated, 200);
  }

  static async deleteLog(c: Context<AppEnv>): Promise<Response> {
    const deleted = await SerialsService.deleteLog(c.req.param("id") as string, c.get("user").id);
    if (!deleted) {
      return sendNotFound(c, "Serial log not found");
    }

    return c.json({ success: true }, 200);
  }
}
