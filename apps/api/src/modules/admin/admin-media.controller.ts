import type { Request, Response } from "express";
import { sendNotFound, sendValidationError } from "../../commons/http/validation-response.helper";
import { AdminMediaService } from "./admin-media.service";
import {
  AdminListMediaQuerySchema,
  AdminMediaIdParamsSchema,
  AdminUpdateFilmSchema,
  AdminUpdateSeriesSchema,
  type AdminListMediaQuery,
} from "./dto/admin-media.dto";
import { AdminAuditService } from "./admin-audit.service";

export class AdminMediaController {
  static async listMovies(
    req: Request<{}, {}, {}, AdminListMediaQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = AdminListMediaQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const movies = await AdminMediaService.listMovies(
      parsed.data.query,
      parsed.data.limit ?? 20,
      parsed.data.offset ?? 0,
    );
    res.status(200).json(movies);
  }

  static async updateMovie(req: Request<{ id: string }>, res: Response): Promise<void> {
    const params = AdminMediaIdParamsSchema.safeParse(req.params);
    const body = AdminUpdateFilmSchema.safeParse(req.body);
    if (!params.success) {
      sendValidationError(res, params.error);
      return;
    }
    if (!body.success) {
      sendValidationError(res, body.error);
      return;
    }

    const updated = await AdminMediaService.updateMovie(params.data.id, body.data);
    if (!updated) {
      sendNotFound(res, "Movie not found");
      return;
    }
    await AdminAuditService.record(req.user, { action: "movie.update", targetType: "movie", targetId: String(params.data.id) });
    res.status(200).json(updated);
  }

  static async refreshMovie(req: Request<{ id: string }>, res: Response): Promise<void> {
    const params = AdminMediaIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendValidationError(res, params.error);
      return;
    }

    const refreshed = await AdminMediaService.refreshMovie(params.data.id);
    if (!refreshed) {
      sendNotFound(res, "Movie not found");
      return;
    }
    await AdminAuditService.record(req.user, { action: "movie.refresh", targetType: "movie", targetId: String(params.data.id) });
    res.status(200).json(refreshed);
  }

  static async deleteMovie(req: Request<{ id: string }>, res: Response): Promise<void> {
    const params = AdminMediaIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendValidationError(res, params.error);
      return;
    }

    const deleted = await AdminMediaService.deleteMovie(params.data.id);
    if (!deleted) {
      sendNotFound(res, "Movie not found");
      return;
    }
    await AdminAuditService.record(req.user, { action: "movie.delete", targetType: "movie", targetId: String(params.data.id) });
    res.status(200).json({ success: true });
  }

  static async listSerials(
    req: Request<{}, {}, {}, AdminListMediaQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = AdminListMediaQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const serials = await AdminMediaService.listSerials(
      parsed.data.query,
      parsed.data.limit ?? 20,
      parsed.data.offset ?? 0,
    );
    res.status(200).json(serials);
  }

  static async updateSerial(req: Request<{ id: string }>, res: Response): Promise<void> {
    const params = AdminMediaIdParamsSchema.safeParse(req.params);
    const body = AdminUpdateSeriesSchema.safeParse(req.body);
    if (!params.success) {
      sendValidationError(res, params.error);
      return;
    }
    if (!body.success) {
      sendValidationError(res, body.error);
      return;
    }

    const updated = await AdminMediaService.updateSerial(params.data.id, body.data);
    if (!updated) {
      sendNotFound(res, "Series not found");
      return;
    }
    await AdminAuditService.record(req.user, { action: "serial.update", targetType: "serial", targetId: String(params.data.id) });
    res.status(200).json(updated);
  }

  static async refreshSerial(req: Request<{ id: string }>, res: Response): Promise<void> {
    const params = AdminMediaIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendValidationError(res, params.error);
      return;
    }

    const refreshed = await AdminMediaService.refreshSerial(params.data.id);
    if (!refreshed) {
      sendNotFound(res, "Series not found");
      return;
    }
    await AdminAuditService.record(req.user, { action: "serial.refresh", targetType: "serial", targetId: String(params.data.id) });
    res.status(200).json(refreshed);
  }

  static async deleteSerial(req: Request<{ id: string }>, res: Response): Promise<void> {
    const params = AdminMediaIdParamsSchema.safeParse(req.params);
    if (!params.success) {
      sendValidationError(res, params.error);
      return;
    }

    const deleted = await AdminMediaService.deleteSerial(params.data.id);
    if (!deleted) {
      sendNotFound(res, "Series not found");
      return;
    }
    await AdminAuditService.record(req.user, { action: "serial.delete", targetType: "serial", targetId: String(params.data.id) });
    res.status(200).json({ success: true });
  }
}
