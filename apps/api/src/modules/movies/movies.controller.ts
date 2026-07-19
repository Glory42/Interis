import type { Context } from "hono";
import { resolveViewerUserIdFromHonoContext } from "../../commons/auth/session-resolver.hono";
import { sendBadRequest, sendNotFound, sendValidationError } from "../../commons/http/validation-response.hono";
import { parseTmdbIdParam } from "../../commons/validation/params.helper";
import { MoviesService } from "./movies.service";
import {
  normalizeCinemaArchiveQuery,
  normalizeMovieDetailQuery,
  SearchMoviesQuerySchema,
} from "./dto/movies.dto";

export class MoviesController {
  static async search(c: Context): Promise<Response> {
    const parsed = SearchMoviesQuerySchema.safeParse(c.req.query());
    if (!parsed.success) {
      return sendValidationError(c, parsed.error);
    }

    const movies = await MoviesService.search(parsed.data.query);
    return c.json(movies, 200);
  }

  static async getByTmdbId(c: Context): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid movie ID");
    }

    const movie = await MoviesService.findOrCreate(tmdbId);
    if (!movie) {
      return sendNotFound(c, "Movie not found");
    }

    return c.json(movie, 200);
  }

  static async getDetailByTmdbId(c: Context): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid movie ID");
    }

    const viewerUserId = await resolveViewerUserIdFromHonoContext(c);

    const detail = await MoviesService.getDetail({
      tmdbId,
      viewerUserId,
      reviewsSort: normalizeMovieDetailQuery(c.req.query()).reviewsSort,
    });

    if (!detail) {
      return sendNotFound(c, "Movie not found");
    }

    c.header("Cache-Control", "no-store");
    return c.json(detail, 200);
  }

  static async getRecent(c: Context): Promise<Response> {
    const movies = await MoviesService.getRecent();
    return c.json(movies, 200);
  }

  static async getArchive(c: Context): Promise<Response> {
    const viewerUserId = await resolveViewerUserIdFromHonoContext(c);

    const archive = await MoviesService.getArchive({
      ...normalizeCinemaArchiveQuery(c.req.query()),
      viewerUserId,
    });

    c.header("Cache-Control", "no-store");
    return c.json(archive, 200);
  }

  static async getTrending(c: Context): Promise<Response> {
    const movies = await MoviesService.getTrending();
    c.header("Cache-Control", "public, max-age=300");
    return c.json(movies, 200);
  }

  static async getLogsByTmdbId(c: Context): Promise<Response> {
    const tmdbId = parseTmdbIdParam(c.req.param("tmdbId"));
    if (tmdbId === null) {
      return sendBadRequest(c, "Invalid movie ID");
    }

    const logs = await MoviesService.getLogsByTmdbId(tmdbId);
    return c.json(logs, 200);
  }
}
