import type { Context } from "hono";
import { PublicService } from "./public.service";
import { sendBadRequest, sendNotFound } from "../../commons/http/validation-response.hono";
import {
  normalizePublicActivityLimit,
  normalizePublicCollectionLimit,
  normalizePublicCurrentlyWatchingLimit,
  normalizePublicDiaryOffset,
  normalizePublicRecentLimit,
} from "./helpers/public-query-normalizer.helper";

export class PublicController {
  private static sendPublicResponse(c: Context, payload: unknown): Response {
    c.header("Cache-Control", "public, max-age=60, stale-while-revalidate=120");
    c.header("Vary", "Accept-Encoding");
    return c.json(payload, 200);
  }

  // GET /api/public/:username/profile
  static async getProfile(c: Context): Promise<Response> {
    const data = await PublicService.getProfile(c.req.param("username") as string);

    if (!data) {
      return sendNotFound(c, "User not found");
    }

    return PublicController.sendPublicResponse(c, data);
  }

  // GET /api/public/:username/recent?limit=10
  static async getRecent(c: Context): Promise<Response> {
    const limit = normalizePublicRecentLimit(c.req.query("limit"));
    const data = await PublicService.getRecentActivity(c.req.param("username") as string, limit);

    if (!data) {
      return sendNotFound(c, "User not found");
    }

    return PublicController.sendPublicResponse(c, data);
  }

  // GET /api/public/:username/activity?limit=30
  static async getActivity(c: Context): Promise<Response> {
    const limit = normalizePublicActivityLimit(c.req.query("limit"));
    const data = await PublicService.getActivity(c.req.param("username") as string, limit);

    if (!data) {
      return sendNotFound(c, "User not found");
    }

    return PublicController.sendPublicResponse(c, data);
  }

  // GET /api/public/:username/reviews?limit=50
  static async getReviews(c: Context): Promise<Response> {
    const limit = normalizePublicCollectionLimit(c.req.query("limit"));
    const data = await PublicService.getReviews(c.req.param("username") as string, limit);

    if (!data) {
      return sendNotFound(c, "User not found");
    }

    return PublicController.sendPublicResponse(c, data);
  }

  // GET /api/public/:username/lists?limit=20
  static async getLists(c: Context): Promise<Response> {
    const limit = normalizePublicCollectionLimit(c.req.query("limit"));
    const data = await PublicService.getLists(c.req.param("username") as string, limit);

    if (!data) {
      return sendNotFound(c, "User not found");
    }

    return PublicController.sendPublicResponse(c, data);
  }

  // GET /api/public/:username/movies/watched?limit=50
  static async getWatchedFilms(c: Context): Promise<Response> {
    const limit = normalizePublicCollectionLimit(c.req.query("limit"));
    const data = await PublicService.getWatchedFilms(c.req.param("username") as string, limit);

    if (!data) {
      return sendNotFound(c, "User not found");
    }

    return PublicController.sendPublicResponse(c, data);
  }

  // GET /api/public/:username/serials/watched?limit=50
  static async getSerialsWatched(c: Context): Promise<Response> {
    const limit = normalizePublicCollectionLimit(c.req.query("limit"));
    const data = await PublicService.getSerialsWatched(c.req.param("username") as string, limit);

    if (!data) {
      return sendNotFound(c, "User not found");
    }

    return PublicController.sendPublicResponse(c, data);
  }

  // GET /api/public/:username/likes?limit=50
  static async getLikes(c: Context): Promise<Response> {
    const limit = normalizePublicCollectionLimit(c.req.query("limit"));
    const data = await PublicService.getLikes(c.req.param("username") as string, limit);

    if (!data) {
      return sendNotFound(c, "User not found");
    }

    return PublicController.sendPublicResponse(c, data);
  }

  // GET /api/public/:username/watchlist?limit=50
  static async getWatchlist(c: Context): Promise<Response> {
    const limit = normalizePublicCollectionLimit(c.req.query("limit"));
    const data = await PublicService.getWatchlist(c.req.param("username") as string, limit);

    if (!data) {
      return sendNotFound(c, "User not found");
    }

    return PublicController.sendPublicResponse(c, data);
  }

  // GET /api/public/:username/diary?limit=50&offset=0
  static async getDiary(c: Context): Promise<Response> {
    const limit = normalizePublicCollectionLimit(c.req.query("limit"));
    const offset = normalizePublicDiaryOffset(c.req.query("offset"));
    const data = await PublicService.getDiary(c.req.param("username") as string, limit, offset);

    if (!data) {
      return sendNotFound(c, "User not found");
    }

    return PublicController.sendPublicResponse(c, data);
  }

  // GET /api/public/:username/top4
  static async getTop4(c: Context): Promise<Response> {
    const data = await PublicService.getTop4(c.req.param("username") as string);

    if (!data) {
      return sendNotFound(c, "User not found");
    }

    return PublicController.sendPublicResponse(c, data);
  }

  // GET /api/public/:username/serials/currently-watching?limit=10
  static async getSerialsCurrentlyWatching(c: Context): Promise<Response> {
    const limit = normalizePublicCurrentlyWatchingLimit(c.req.query("limit"));
    const data = await PublicService.getSerialsCurrentlyWatching(
      c.req.param("username") as string,
      limit,
    );

    if (!data) {
      return sendNotFound(c, "User not found");
    }

    return PublicController.sendPublicResponse(c, data);
  }

  // GET /api/public/:username/serials/:tmdbId
  static async getSerialProgress(c: Context): Promise<Response> {
    const tmdbId = Number.parseInt(c.req.param("tmdbId") as string, 10);
    if (Number.isNaN(tmdbId)) {
      return sendBadRequest(c, "Invalid tmdbId");
    }

    const data = await PublicService.getSerialProgress(c.req.param("username") as string, tmdbId);

    if (!data) {
      return sendNotFound(c, "User not found");
    }

    return PublicController.sendPublicResponse(c, data);
  }
}
