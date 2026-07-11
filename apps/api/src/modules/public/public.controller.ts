import type { Request, Response } from "express";
import { PublicService } from "./public.service";
import {
  normalizePublicActivityLimit,
  normalizePublicCollectionLimit,
  normalizePublicCurrentlyWatchingLimit,
  normalizePublicDiaryOffset,
  normalizePublicRecentLimit,
} from "./helpers/public-query-normalizer.helper";
import type {
  PublicActivityQueryDto,
  PublicCollectionQueryDto,
  PublicCurrentlyWatchingQueryDto,
  PublicDiaryQueryDto,
  PublicRecentQueryDto,
} from "./dto/public.dto";

export class PublicController {
  private static sendUserNotFound(res: Response): void {
    res.status(404).json({ error: "User not found" });
  }

  private static sendPublicResponse(res: Response, payload: unknown): void {
    res.setHeader("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    res.setHeader("Vary", "Accept-Encoding");
    res.status(200).json(payload);
  }

  // GET /api/public/:username/profile
  static async getProfile(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    const data = await PublicService.getProfile(req.params.username);

    if (!data) {
      PublicController.sendUserNotFound(res);
      return;
    }

    PublicController.sendPublicResponse(res, data);
  }

  // GET /api/public/:username/recent?limit=10
  static async getRecent(
    req: Request<{ username: string }, unknown, unknown, PublicRecentQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizePublicRecentLimit(req.query.limit);
    const data = await PublicService.getRecentActivity(
      req.params.username,
      limit,
    );

    if (!data) {
      PublicController.sendUserNotFound(res);
      return;
    }

    PublicController.sendPublicResponse(res, data);
  }

  // GET /api/public/:username/activity?limit=30
  static async getActivity(
    req: Request<{ username: string }, unknown, unknown, PublicActivityQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizePublicActivityLimit(req.query.limit);
    const data = await PublicService.getActivity(req.params.username, limit);

    if (!data) {
      PublicController.sendUserNotFound(res);
      return;
    }

    PublicController.sendPublicResponse(res, data);
  }

  // GET /api/public/:username/reviews?limit=50
  static async getReviews(
    req: Request<{ username: string }, unknown, unknown, PublicCollectionQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizePublicCollectionLimit(req.query.limit);
    const data = await PublicService.getReviews(req.params.username, limit);

    if (!data) {
      PublicController.sendUserNotFound(res);
      return;
    }

    PublicController.sendPublicResponse(res, data);
  }

  // GET /api/public/:username/lists?limit=20
  static async getLists(
    req: Request<{ username: string }, unknown, unknown, PublicCollectionQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizePublicCollectionLimit(req.query.limit);
    const data = await PublicService.getLists(req.params.username, limit);

    if (!data) {
      PublicController.sendUserNotFound(res);
      return;
    }

    PublicController.sendPublicResponse(res, data);
  }

  // GET /api/public/:username/movies/watched?limit=50
  static async getWatchedFilms(
    req: Request<{ username: string }, unknown, unknown, PublicCollectionQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizePublicCollectionLimit(req.query.limit);
    const data = await PublicService.getWatchedFilms(req.params.username, limit);

    if (!data) {
      PublicController.sendUserNotFound(res);
      return;
    }

    PublicController.sendPublicResponse(res, data);
  }

  // GET /api/public/:username/serials/watched?limit=50
  static async getSerialsWatched(
    req: Request<{ username: string }, unknown, unknown, PublicCollectionQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizePublicCollectionLimit(req.query.limit);
    const data = await PublicService.getSerialsWatched(req.params.username, limit);

    if (!data) {
      PublicController.sendUserNotFound(res);
      return;
    }

    PublicController.sendPublicResponse(res, data);
  }

  // GET /api/public/:username/likes?limit=50
  static async getLikes(
    req: Request<{ username: string }, unknown, unknown, PublicCollectionQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizePublicCollectionLimit(req.query.limit);
    const data = await PublicService.getLikes(req.params.username, limit);

    if (!data) {
      PublicController.sendUserNotFound(res);
      return;
    }

    PublicController.sendPublicResponse(res, data);
  }

  // GET /api/public/:username/watchlist?limit=50
  static async getWatchlist(
    req: Request<{ username: string }, unknown, unknown, PublicCollectionQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizePublicCollectionLimit(req.query.limit);
    const data = await PublicService.getWatchlist(req.params.username, limit);

    if (!data) {
      PublicController.sendUserNotFound(res);
      return;
    }

    PublicController.sendPublicResponse(res, data);
  }

  // GET /api/public/:username/diary?limit=50&offset=0
  static async getDiary(
    req: Request<{ username: string }, unknown, unknown, PublicDiaryQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizePublicCollectionLimit(req.query.limit);
    const offset = normalizePublicDiaryOffset(req.query.offset);
    const data = await PublicService.getDiary(req.params.username, limit, offset);

    if (!data) {
      PublicController.sendUserNotFound(res);
      return;
    }

    PublicController.sendPublicResponse(res, data);
  }

  // GET /api/public/:username/top4
  static async getTop4(
    req: Request<{ username: string }>,
    res: Response,
  ): Promise<void> {
    const data = await PublicService.getTop4(req.params.username);

    if (!data) {
      PublicController.sendUserNotFound(res);
      return;
    }

    PublicController.sendPublicResponse(res, data);
  }

  // GET /api/public/:username/serials/currently-watching?limit=10
  static async getSerialsCurrentlyWatching(
    req: Request<{ username: string }, unknown, unknown, PublicCurrentlyWatchingQueryDto>,
    res: Response,
  ): Promise<void> {
    const limit = normalizePublicCurrentlyWatchingLimit(req.query.limit);
    const data = await PublicService.getSerialsCurrentlyWatching(req.params.username, limit);

    if (!data) {
      PublicController.sendUserNotFound(res);
      return;
    }

    PublicController.sendPublicResponse(res, data);
  }

  // GET /api/public/:username/serials/:tmdbId
  static async getSerialProgress(
    req: Request<{ username: string; tmdbId: string }>,
    res: Response,
  ): Promise<void> {
    const tmdbId = Number.parseInt(req.params.tmdbId, 10);
    if (Number.isNaN(tmdbId)) {
      res.status(400).json({ error: "Invalid tmdbId" });
      return;
    }

    const data = await PublicService.getSerialProgress(req.params.username, tmdbId);

    if (!data) {
      PublicController.sendUserNotFound(res);
      return;
    }

    PublicController.sendPublicResponse(res, data);
  }
}
