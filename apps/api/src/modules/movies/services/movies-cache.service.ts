import {
  getMovieDetails as tmdbGetDetails,
  getMovieDirector,
  type TMDBMovieDetail,
} from "../../../infrastructure/tmdb/cinemas";
import { MoviesRepository } from "../repositories/movies.repository";

// Released movies rarely change on TMDB (unlike still-airing series), so a
// long TTL is fine here — this mainly guards against permanently stale
// poster/overview edits rather than fast-moving data like episode counts.
const MOVIE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const isStale = (cachedAt: Date): boolean => {
  return Date.now() - cachedAt.getTime() > MOVIE_CACHE_TTL_MS;
};

export class MoviesCacheService {
  static async findOrCreate(tmdbId: number) {
    const existing = await MoviesRepository.findByTmdbId(tmdbId);
    if (existing && !isStale(existing.cachedAt)) {
      return existing;
    }

    const tmdbData = await tmdbGetDetails(tmdbId).catch(() => null);
    const cachedMovie = tmdbData ? await MoviesCacheService.cacheMovie(tmdbData) : null;

    if (cachedMovie) {
      return cachedMovie;
    }

    if (existing) {
      return existing;
    }

    throw new Error(`Failed to cache movie for tmdbId=${tmdbId}`);
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
