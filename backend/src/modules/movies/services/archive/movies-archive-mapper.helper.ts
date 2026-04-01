import type {
  TMDBDiscoverMovie,
  TMDBMovieGenre,
} from "../../../../infrastructure/tmdb/cinemas";
import {
  normalizeMovieGenres,
  toTmdbReleaseDate,
  toTmdbReleaseYear,
} from "../../helpers/movies-format.helper";
import { MoviesRepository } from "../../repositories/movies.repository";
import type {
  ArchiveGenre,
  CinemaArchiveItem,
  LocalArchiveAggregate,
} from "../../types/movies.types";

export const getLocalArchiveAggregatesByTmdbIds = async (
  tmdbIds: number[],
): Promise<Map<number, LocalArchiveAggregate>> => {
  const rows = await MoviesRepository.getLocalArchiveAggregateRowsByTmdbIds(tmdbIds);

  return new Map(
    rows.map((row) => [
      row.tmdbId,
      {
        tmdbId: row.tmdbId,
        releaseDate: row.releaseDate,
        releaseYear: row.releaseYear,
        director: row.director,
        languageCode: null,
        genres: normalizeMovieGenres(row.genres),
        logCount: row.logCount,
        avgRatingOutOfTen: row.avgRatingOutOfTen,
        tmdbRatingOutOfTen: null,
        ratedLogCount: row.ratedLogCount,
      },
    ]),
  );
};

export const mapTmdbArchiveMovie = (
  tmdbMovie: TMDBDiscoverMovie,
  genreById: Map<number, TMDBMovieGenre>,
  localAggregate: LocalArchiveAggregate | undefined,
): CinemaArchiveItem => {
  const releaseDate = toTmdbReleaseDate(tmdbMovie.release_date);
  const releaseYear = toTmdbReleaseYear(releaseDate);

  const genresFromTmdb = tmdbMovie.genre_ids
    .map((genreId) => {
      const genre = genreById.get(genreId);
      if (!genre) {
        return null;
      }

      return {
        id: genre.id,
        name: genre.name,
      };
    })
    .filter((genre): genre is ArchiveGenre => genre !== null);

  const genres =
    genresFromTmdb.length > 0 ? genresFromTmdb : (localAggregate?.genres ?? []);

  return {
    tmdbId: tmdbMovie.id,
    title: tmdbMovie.title,
    posterPath: tmdbMovie.poster_path,
    backdropPath: tmdbMovie.backdrop_path,
    releaseDate: localAggregate?.releaseDate ?? releaseDate,
    releaseYear: localAggregate?.releaseYear ?? releaseYear,
    director: localAggregate?.director ?? null,
    languageCode:
      localAggregate?.languageCode ??
      (tmdbMovie.original_language.trim().length > 0
        ? tmdbMovie.original_language.toLowerCase()
        : null),
    genres,
    primaryGenre: genres[0]?.name ?? null,
    logCount: localAggregate?.logCount ?? 0,
    avgRatingOutOfTen: localAggregate?.avgRatingOutOfTen ?? null,
    tmdbRatingOutOfTen:
      localAggregate?.tmdbRatingOutOfTen ??
      (tmdbMovie.vote_count > 0 && Number.isFinite(tmdbMovie.vote_average)
        ? Number(tmdbMovie.vote_average.toFixed(1))
        : null),
    ratedLogCount: localAggregate?.ratedLogCount ?? 0,
  };
};
