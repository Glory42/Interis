import type { Request, Response } from "express";
import { resolveViewerUserIdFromHeaders } from "../../commons/auth/session-resolver.helper";
import { sendBadRequest, sendNotFound, sendValidationError } from "../../commons/http/validation-response.helper";
import { parseTmdbIdParam } from "../../commons/validation/params.helper";
import { FilmsService } from "./films.service";
import type {
  FilmArchiveQuery,
  FilmDetailQuery,
  FilmParams,
  SearchFilmsQuery,
} from "./dto/films.dto";
import {
  normalizeFilmArchiveQuery,
  normalizeFilmDetailQuery,
  normalizeFilmLogsQuery,
  SearchFilmsQuerySchema,
} from "./dto/films.dto";

export class FilmsController {
  static async search(
    req: Request<{}, {}, {}, SearchFilmsQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = SearchFilmsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const movies = await FilmsService.search(parsed.data.query);
    res.status(200).json(movies);
  }

  static async getByTmdbId(
    req: Request<FilmParams>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid movie ID");
      return;
    }

    const movie = await FilmsService.findForRead(tmdbId);
    if (!movie) {
      sendNotFound(res, "Movie not found");
      return;
    }

    res.status(200).json(movie);
  }

  static async getDetailByTmdbId(
    req: Request<FilmParams, {}, {}, FilmDetailQuery>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid movie ID");
      return;
    }

    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);
    const { reviewsSort, reviewsPage, reviewsLimit } = normalizeFilmDetailQuery(req.query);

    const detail = await FilmsService.getDetail({
      tmdbId,
      viewerUserId,
      reviewsSort,
      reviewsPage,
      reviewsLimit,
    });

    if (!detail) {
      sendNotFound(res, "Movie not found");
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(detail);
  }

  static async getReviews(
    req: Request<FilmParams, {}, {}, FilmDetailQuery>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid movie ID");
      return;
    }

    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);
    const { reviewsSort, reviewsPage, reviewsLimit } = normalizeFilmDetailQuery(req.query);

    const reviews = await FilmsService.getReviews({
      tmdbId,
      viewerUserId,
      sort: reviewsSort,
      page: reviewsPage,
      limit: reviewsLimit,
    });

    if (!reviews) {
      sendNotFound(res, "Movie not found");
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(reviews);
  }

  static async getRecent(_req: Request, res: Response): Promise<void> {
    const movies = await FilmsService.getRecent();
    res.status(200).json(movies);
  }

  static async getArchive(
    req: Request<{}, {}, {}, FilmArchiveQuery>,
    res: Response,
  ): Promise<void> {
    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);

    const archive = await FilmsService.getArchive({
      ...normalizeFilmArchiveQuery(req.query),
      viewerUserId,
    });

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(archive);
  }

  static async getTrending(_req: Request, res: Response): Promise<void> {
    const movies = await FilmsService.getTrending();
    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).json(movies);
  }

  static async getLogsByTmdbId(
    req: Request<FilmParams>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid movie ID");
      return;
    }

    const { limit, offset } = normalizeFilmLogsQuery(req.query);
    const logs = await FilmsService.getLogsByTmdbId(tmdbId, limit, offset);
    res.status(200).json(logs);
  }
}
