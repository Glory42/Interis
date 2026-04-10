import type { Request, Response } from "express";
import { resolveViewerUserIdFromHeaders } from "../../commons/auth/session-resolver.helper";
import {
  sendBadRequest,
  sendValidationError,
} from "../../commons/http/validation-response.helper";
import { parseTmdbIdParam } from "../../commons/validation/params.helper";
import { MoviesService } from "./movies.service";
import type {
  CinemaArchiveQuery,
  MovieDetailQuery,
  MovieParams,
  SearchMoviesQuery,
} from "./dto/movies.dto";
import {
  normalizeCinemaArchiveQuery,
  normalizeMovieDetailQuery,
  SearchMoviesQuerySchema,
} from "./dto/movies.dto";

export class MoviesController {
  static async search(
    req: Request<{}, {}, {}, SearchMoviesQuery>,
    res: Response,
  ): Promise<void> {
    const parsed = SearchMoviesQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      sendValidationError(res, parsed.error);
      return;
    }

    const movies = await MoviesService.search(parsed.data.query);
    res.status(200).json(movies);
  }

  static async getByTmdbId(
    req: Request<MovieParams>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid movie ID");
      return;
    }

    const movie = await MoviesService.findOrCreate(tmdbId);
    if (!movie) {
      res.status(404).json({ error: "Movie not found" });
      return;
    }

    res.status(200).json(movie);
  }

  static async getDetailByTmdbId(
    req: Request<MovieParams, {}, {}, MovieDetailQuery>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid movie ID");
      return;
    }

    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);

    const detail = await MoviesService.getDetail({
      tmdbId,
      viewerUserId,
      reviewsSort: normalizeMovieDetailQuery(req.query).reviewsSort,
    });

    if (!detail) {
      res.status(404).json({ error: "Movie not found" });
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(detail);
  }

  static async getRecent(_req: Request, res: Response): Promise<void> {
    const movies = await MoviesService.getRecent();
    res.status(200).json(movies);
  }

  static async getArchive(
    req: Request<{}, {}, {}, CinemaArchiveQuery>,
    res: Response,
  ): Promise<void> {
    const viewerUserId = await resolveViewerUserIdFromHeaders(req.headers);

    const archive = await MoviesService.getArchive({
      ...normalizeCinemaArchiveQuery(req.query),
      viewerUserId,
    });

    res.setHeader("Cache-Control", "no-store");
    res.status(200).json(archive);
  }

  static async getTrending(_req: Request, res: Response): Promise<void> {
    const movies = await MoviesService.getTrending();
    res.setHeader("Cache-Control", "public, max-age=300");
    res.status(200).json(movies);
  }

  static async getLogsByTmdbId(
    req: Request<MovieParams>,
    res: Response,
  ): Promise<void> {
    const tmdbId = parseTmdbIdParam(req.params.tmdbId);
    if (tmdbId === null) {
      sendBadRequest(res, "Invalid movie ID");
      return;
    }

    const logs = await MoviesService.getLogsByTmdbId(tmdbId);
    res.status(200).json(logs);
  }
}
