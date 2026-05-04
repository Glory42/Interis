import {
  getMovieDetails as tmdbGetDetails,
  getMovieDirector,
  type TMDBMovieDetail,
} from "../../../infrastructure/tmdb/cinemas";
import { MoviesRepository } from "../repositories/movies.repository";

export class MoviesCacheService {
  static async findOrCreate(tmdbId: number) {
    const existing = await MoviesRepository.findByTmdbId(tmdbId);
    if (existing) {
      return existing;
    }

    const tmdbData = await tmdbGetDetails(tmdbId);
    const cachedMovie = await MoviesCacheService.cacheMovie(tmdbData);

    if (!cachedMovie) {
      throw new Error(`Failed to cache movie for tmdbId=${tmdbId}`);
    }

    return cachedMovie;
  }

  static async cacheMovie(tmdbData: TMDBMovieDetail) {
    const releaseDate =
      tmdbData.release_date && /^\d{4}-\d{2}-\d{2}$/.test(tmdbData.release_date)
        ? tmdbData.release_date
        : null;
    const releaseYear = releaseDate
      ? new Date(releaseDate).getUTCFullYear()
      : tmdbData.release_date
        ? Number.parseInt(tmdbData.release_date.slice(0, 4), 10)
        : null;
    const director = await getMovieDirector(tmdbData.id).catch(() => null);

    return MoviesRepository.upsertCachedMovie({
      tmdbId: tmdbData.id,
      title: tmdbData.title,
      originalTitle: tmdbData.original_title || null,
      posterPath: tmdbData.poster_path,
      backdropPath: tmdbData.backdrop_path,
      releaseDate,
      releaseYear,
      director,
      runtime: tmdbData.runtime,
      overview: tmdbData.overview || null,
      tagline: tmdbData.tagline || null,
      genres: tmdbData.genres,
    });
  }
}
