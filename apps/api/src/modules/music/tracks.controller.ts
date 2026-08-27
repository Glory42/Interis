import type { Request, Response } from "express";
import { sendBadRequest, sendNotFound, sendValidationError } from "../../commons/http/validation-response.helper";
import { parseMbidParam } from "./dto/music.dto";
import { CreateTrackLogSchema, UpdateTrackInteractionSchema, UpdateTrackLogSchema } from "./dto/tracks.dto";
import { TracksService } from "./services/tracks.service";

export class TracksController {
  static async getByMbid(req: Request<{ mbid: string }>, res: Response): Promise<void> {
    const mbid = parseMbidParam(req.params.mbid);
    if (!mbid) {
      sendBadRequest(res, "Invalid track ID");
      return;
    }
    const track = await TracksService.findOrCreate(mbid);
    if (!track) {
      sendNotFound(res, "Track not found");
      return;
    }
    res.status(200).json(track);
  }

  static async getLogsByMbid(req: Request<{ mbid: string }>, res: Response): Promise<void> {
    const mbid = parseMbidParam(req.params.mbid);
    if (!mbid) {
      sendBadRequest(res, "Invalid track ID");
      return;
    }
    const logs = await TracksService.getLogsByMbid(mbid);
    if (logs === null) {
      sendNotFound(res, "Track not found");
      return;
    }
    res.status(200).json(logs);
  }

  static async getInteraction(req: Request<{ mbid: string }>, res: Response): Promise<void> {
    const mbid = parseMbidParam(req.params.mbid);
    if (!mbid) {
      sendBadRequest(res, "Invalid track ID");
      return;
    }
    const interaction = await TracksService.getInteraction(req.user.id, mbid);
    res.status(200).json(interaction);
  }

  static async updateInteraction(req: Request<{ mbid: string }>, res: Response): Promise<void> {
    const mbid = parseMbidParam(req.params.mbid);
    if (!mbid) {
      sendBadRequest(res, "Invalid track ID");
      return;
    }
    const parsed = UpdateTrackInteractionSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const result = await TracksService.updateInteraction(req.user.id, mbid, parsed.data);
    res.status(200).json(result);
  }

  static async createLog(req: Request<{ mbid: string }>, res: Response): Promise<void> {
    const mbid = parseMbidParam(req.params.mbid);
    if (!mbid) {
      sendBadRequest(res, "Invalid track ID");
      return;
    }
    const parsed = CreateTrackLogSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const result = await TracksService.createLog(req.user.id, mbid, parsed.data);
    if (!result) {
      sendNotFound(res, "Track not found");
      return;
    }
    res.status(201).json(result);
  }

  static async getMyLogs(req: Request, res: Response): Promise<void> {
    const logs = await TracksService.getMyLogs(req.user.id);
    res.status(200).json(logs);
  }

  static async updateLog(req: Request<{ id: string }>, res: Response): Promise<void> {
    const parsed = UpdateTrackLogSchema.safeParse(req.body);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }
    const updated = await TracksService.updateLog(req.params.id, req.user.id, parsed.data);
    if (!updated) {
      sendNotFound(res, "Log not found");
      return;
    }
    res.status(200).json(updated);
  }

  static async deleteLog(req: Request<{ id: string }>, res: Response): Promise<void> {
    const deleted = await TracksService.deleteLog(req.params.id, req.user.id);
    if (!deleted) {
      sendNotFound(res, "Log not found");
      return;
    }
    res.status(200).json({ success: true });
  }
}
