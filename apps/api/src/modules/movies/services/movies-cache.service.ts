import {
  getMovieDetails as tmdbGetDetails,
  getMovieDirector,
  type TMDBMovieDetail,
} from "../../../infrastructure/tmdb/movies";
import { MoviesRepository } from "../repositories/movies.repository";
import { NotFoundError } from "../../../commons/errors/app-error";
import { hasCachedMediaChanged } from "../../media/helpers/media-cache-diff.helper";
import { UNSAVED_MEDIA_ID } from "../../media/constants/unsaved-media.constants";

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

    throw new NotFoundError("Movie not found");
  }

  // Cached row only, no TMDB fetch - for checks where an uncached title can't match anything.
  static async findCached(tmdbId: number) {
    return MoviesRepository.findByTmdbId(tmdbId);
  }

  // Read-path variant: never inserts. An uncached title is returned as an unsaved row
  // (id = UNSAVED_MEDIA_ID) - it only gets a DB row once someone logs/reviews/lists it.
  // A stale cached row is rewritten only if TMDB data actually changed.
  static async findForRead(tmdbId: number) {
    const existing = await MoviesRepository.findByTmdbId(tmdbId);
    if (existing && !isStale(existing.cachedAt)) {
      return existing;
    }

    const tmdbData = await tmdbGetDetails(tmdbId).catch(() => null);
    if (!tmdbData) {
      if (existing) {
        return existing;
      }
      throw new NotFoundError("Movie not found");
    }

    const values = await MoviesCacheService.toCachedMovieValues(tmdbData);
    if (!existing) {
      return { ...values, id: UNSAVED_MEDIA_ID, cachedAt: new Date() };
    }

    const merged = { ...values, director: values.director ?? existing.director };
    if (!hasCachedMediaChanged(existing, merged)) {
      return existing;
    }

    return (await MoviesRepository.upsertCachedMovie(merged)) ?? existing;
  }

  // Bypasses the TTL check above — always refetches from TMDB.
  static async refreshForAdmin(tmdbId: number) {
    const tmdbData = await tmdbGetDetails(tmdbId);
    return MoviesCacheService.cacheMovie(tmdbData);
  }

  static async cacheMovie(tmdbData: TMDBMovieDetail) {
    return MoviesRepository.upsertCachedMovie(
      await MoviesCacheService.toCachedMovieValues(tmdbData),
    );
  }

  private static async toCachedMovieValues(tmdbData: TMDBMovieDetail) {
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

    return {
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
    };
  }
}
