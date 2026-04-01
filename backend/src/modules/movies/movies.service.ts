import {
  getNowPlayingMovies as tmdbNowPlaying,
  getTrendingMovies as tmdbTrending,
  searchMovies as tmdbSearch,
  type TMDBMovieDetail,
  type TMDBSearchMovie,
} from "../../infrastructure/tmdb/cinemas";
import { MoviesArchiveService } from "./services/movies-archive.service";
import { MoviesCacheService } from "./services/movies-cache.service";
import { MoviesDetailService } from "./services/movies-detail.service";

export class MoviesService {
  static async search(query: string): Promise<TMDBSearchMovie[]> {
    return tmdbSearch(query);
  }

  static async getRecent(): Promise<TMDBSearchMovie[]> {
    return tmdbNowPlaying();
  }

  static async getTrending() {
    const trendingMovies = await tmdbTrending("week");

    return trendingMovies.slice(0, 4).map((movie) => {
      const releaseYear = movie.release_date
        ? Number.parseInt(movie.release_date.slice(0, 4), 10)
        : Number.NaN;

      return {
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        releaseYear: Number.isNaN(releaseYear) ? null : releaseYear,
      };
    });
  }

  static async findOrCreate(tmdbId: number) {
    return MoviesCacheService.findOrCreate(tmdbId);
  }

  static async cacheMovie(tmdbData: TMDBMovieDetail) {
    return MoviesCacheService.cacheMovie(tmdbData);
  }

  static async getDetail(input: {
    tmdbId: number;
    viewerUserId?: string | null;
    reviewsSort?: string;
  }) {
    return MoviesDetailService.getDetail(input);
  }

  static async getArchive(input: {
    genre?: string;
    language?: string;
    sort?: string;
    period?: string;
    page?: string;
    limit?: string;
  }) {
    return MoviesArchiveService.getArchive(input);
  }

  static async getLogsByTmdbId(tmdbId: number) {
    return MoviesDetailService.getLogsByTmdbId(tmdbId);
  }
}
