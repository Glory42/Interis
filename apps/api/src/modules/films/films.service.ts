import {
  getNowPlayingFilms as tmdbNowPlaying,
  getTrendingFilms as tmdbTrending,
  searchFilms as tmdbSearch,
  type TMDBFilmDetail,
  type TMDBSearchFilm,
} from "../../infrastructure/tmdb/films";
import type {
  FilmArchivePeriod,
  FilmArchiveSort,
  FilmDetailReviewSort,
} from "./dto/films.dto";
import { FilmsArchiveService } from "./services/films-archive.service";
import { FilmsCacheService } from "./services/films-cache.service";
import { FilmsDetailService } from "./services/films-detail.service";
import { FilmsRepository } from "./repositories/films.repository";

export class FilmsService {
  static async search(query: string): Promise<TMDBSearchFilm[]> {
    return tmdbSearch(query);
  }

  static async getRecent(): Promise<TMDBSearchFilm[]> {
    return tmdbNowPlaying();
  }

  static async getTrending() {
    const trendingMovies = await tmdbTrending("week");

    return trendingMovies.slice(0, 9).map((movie) => {
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
    return FilmsCacheService.findOrCreate(tmdbId);
  }

  static async findForRead(tmdbId: number) {
    return FilmsCacheService.findForRead(tmdbId);
  }

  static async cacheMovie(tmdbData: TMDBFilmDetail) {
    return FilmsCacheService.cacheMovie(tmdbData);
  }

  static async getDetail(input: {
    tmdbId: number;
    viewerUserId?: string | null;
    reviewsSort: FilmDetailReviewSort;
    reviewsPage: number;
    reviewsLimit: number;
  }) {
    return FilmsDetailService.getDetail(input);
  }

  static async getReviews(input: {
    tmdbId: number;
    viewerUserId?: string | null;
    sort: FilmDetailReviewSort;
    page: number;
    limit: number;
  }) {
    return FilmsDetailService.getReviews(input);
  }

  static async getArchive(input: {
    genre: string | null;
    language: string | null;
    sort: FilmArchiveSort;
    period: FilmArchivePeriod;
    page: number;
    limit: number;
    viewerUserId?: string | null;
  }) {
    return FilmsArchiveService.getArchive(input);
  }

  static async getLogsByTmdbId(tmdbId: number, limit?: number, offset?: number) {
    return FilmsDetailService.getLogsByTmdbId(tmdbId, limit, offset);
  }

  static async findCachedDirectors(tmdbIds: number[]): Promise<Map<number, string>> {
    const rows = await FilmsRepository.findDirectorsByTmdbIds(tmdbIds);
    return new Map(rows.flatMap((row) => (row.director ? [[row.tmdbId, row.director] as const] : [])));
  }
}
