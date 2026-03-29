import type { Request, Response } from "express";
import { MoviesService } from "./movies.service";
import type { MovieParams, SearchMoviesQuery } from "./dto/movies.dto";

export class MoviesController {
  static async search(
    req: Request<{}, {}, {}, SearchMoviesQuery>,
    res: Response,
  ): Promise<void> {
    const query = req.query.query?.trim();
    if (!query) {
      res.status(400).json({ error: "Search query is required" });
      return;
    }

    const movies = await MoviesService.search(query);
    res.status(200).json(movies);
  }

  static async getByTmdbId(
    req: Request<MovieParams>,
    res: Response,
  ): Promise<void> {
    const tmdbId = Number.parseInt(req.params.tmdbId, 10);
    if (Number.isNaN(tmdbId)) {
      res.status(400).json({ error: "Invalid movie ID" });
      return;
    }

    const movie = await MoviesService.findOrCreate(tmdbId);
    if (!movie) {
      res.status(404).json({ error: "Movie not found" });
      return;
    }

    res.status(200).json(movie);
  }

  static async getRecent(_req: Request, res: Response): Promise<void> {
    const movies = await MoviesService.getRecent();
    res.status(200).json(movies);
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
    const tmdbId = Number.parseInt(req.params.tmdbId, 10);
    if (Number.isNaN(tmdbId)) {
      res.status(400).json({ error: "Invalid movie ID" });
      return;
    }

    const logs = await MoviesService.getLogsByTmdbId(tmdbId);
    res.status(200).json(logs);
  }
}
