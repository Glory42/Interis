import type { Request, Response } from "express";
import { resolveViewerUserIdFromHeaders } from "../../commons/auth/session-resolver.helper";
import { sendBadRequest, sendValidationError } from "../../commons/http/validation-response.helper";
import { MusicService } from "./music.service";
import {
  SearchMusicQuerySchema,
  CreateMusicLogSchema,
  UpdateMusicLogSchema,
  UpdateMusicInteractionSchema,
  normalizeMusicArchiveQuery,
  normalizeMusicDetailQuery,
  parseMbidParam,
  type SearchMusicQuery,
  type MusicDetailQuery,
} from "./dto/music.dto";

export class MusicController {
  static async search(
    req: Request<{}, {}, {}, SearchMusicQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = SearchMusicQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const results = await MusicService.search(parsed.data.query);
    res.status(200).json(results);
  }

  static async getByMbid(req: Request<{ mbid: string }>, res: Response): Promise<void> {
    const mbid = parseMbidParam(req.params.mbid);
    if (!mbid) {
      sendBadRequest(res, "Invalid album ID");
      return;
    }
    const album = await MusicService.findOrCreate(mbid);
    if (!album) {
      res.status(404).json({ error: "Album not found" });
      return;
    }
    res.status(200).json(album);
  }

  static async getDetailByMbid(
    req: Request<{ mbid: string }, {}, {}, MusicDetailQuery>,
    res: Response,
  ): Promise<void> {
    const mbid = parseMbidParam(req.params.mbid);
    if (!mbid) {
      sendBadRequest(res, "Invalid album ID");
      return;
    }
    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);
    const detail = await MusicService.getDetail({
      mbid,
      viewerUserId,
      reviewsSort: normalizeMusicDetailQuery(req.query).reviewsSort,
    });
    if (!detail) {
      res.status(404).json({ error: "Album not found" });
      return;
    }
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(detail);
  }

  static async getArchive(
    req: Request<{}, {}, {}, Record<string, string>>,
    res: Response,
  ): Promise<void> {
    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);
    const archive = await MusicService.getArchive({
      ...normalizeMusicArchiveQuery(req.query),
      viewerUserId,
    });
    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(archive);
  }

  static async getLogsByMbid(req: Request<{ mbid: string }>, res: Response): Promise<void> {
    const mbid = parseMbidParam(req.params.mbid);
    if (!mbid) {
      sendBadRequest(res, "Invalid album ID");
      return;
    }
    const logs = await MusicService.getLogsByMbid(mbid);
    if (logs === null) {
      res.status(404).json({ error: "Album not found" });
      return;
    }
    res.status(200).json(logs);
  }

  static async getInteraction(req: Request<{ mbid: string }>, res: Response): Promise<void> {
    const mbid = parseMbidParam(req.params.mbid);
    if (!mbid) {
      sendBadRequest(res, "Invalid album ID");
      return;
    }
    const interaction = await MusicService.getInteraction(req.user.id, mbid);
    res.status(200).json(interaction);
  }

  static async updateInteraction(req: Request<{ mbid: string }>, res: Response): Promise<void> {
    const mbid = parseMbidParam(req.params.mbid);
    if (!mbid) {
      sendBadRequest(res, "Invalid album ID");
      return;
    }
    const parsed = UpdateMusicInteractionSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const result = await MusicService.updateInteraction(req.user.id, mbid, parsed.data);
    res.status(200).json(result);
  }

  static async createLog(req: Request<{ mbid: string }>, res: Response): Promise<void> {
    const mbid = parseMbidParam(req.params.mbid);
    if (!mbid) {
      sendBadRequest(res, "Invalid album ID");
      return;
    }
    const parsed = CreateMusicLogSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const result = await MusicService.createLog(req.user.id, mbid, parsed.data);
    if (!result) {
      res.status(404).json({ error: "Album not found" });
      return;
    }
    res.status(201).json(result);
  }

  static async getMyLogs(_req: Request, res: Response): Promise<void> {
    const logs = await MusicService.getMyLogs(_req.user.id);
    res.status(200).json(logs);
  }

  static async updateLog(req: Request<{ id: string }>, res: Response): Promise<void> {
    const parsed = UpdateMusicLogSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const updated = await MusicService.updateLog(req.params.id, req.user.id, parsed.data);
    if (!updated) {
      res.status(404).json({ error: "Log not found" });
      return;
    }
    res.status(200).json(updated);
  }

  static async deleteLog(req: Request<{ id: string }>, res: Response): Promise<void> {
    const deleted = await MusicService.deleteLog(req.params.id, req.user.id);
    if (!deleted) {
      res.status(404).json({ error: "Log not found" });
      return;
    }
    res.status(200).json({ success: true });
  }
}
