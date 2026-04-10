import type {
  TMDBDiscoverSeries,
  TMDBSeriesGenre,
} from "../../../../infrastructure/tmdb/serials";
import {
  normalizeSeriesGenres,
  toFirstAirDate,
  toFirstAirYear,
} from "../../helpers/serials-format.helper";
import { toTmdbRatingOutOfTen } from "../../helpers/serials-normalization.helper";
import { SerialsArchiveRepository } from "../../repositories/serials-archive.repository";
import type {
  SerialArchiveItem,
  SerialGenre,
} from "../../types/serials.types";

type LocalArchiveRow = Awaited<
  ReturnType<typeof SerialsArchiveRepository.getCachedArchiveRows>
>[number];

type LocalArchiveAggregateRow = Awaited<
  ReturnType<typeof SerialsArchiveRepository.getLocalArchiveAggregateRowsByTmdbIds>
>[number];

export const toArchiveItemFromLocalRow = (row: LocalArchiveRow): SerialArchiveItem => {
  const genres = normalizeSeriesGenres(row.genres);

  return {
    tmdbId: row.tmdbId,
    title: row.title,
    posterPath: row.posterPath,
    backdropPath: row.backdropPath,
    firstAirDate: row.firstAirDate,
    firstAirYear: row.firstAirYear,
    creator: row.creator,
    network: row.network,
    languageCode: row.languageCode,
    genres,
    primaryGenre: genres[0]?.name ?? null,
    logCount: row.logCount,
    avgRatingOutOfTen: row.avgRatingOutOfTen,
    tmdbRatingOutOfTen: null,
    ratedLogCount: row.ratedLogCount,
    viewerHasLogged: false,
    viewerWatchlisted: false,
  };
};

export const getLocalArchiveAggregatesByTmdbIds = async (
  tmdbIds: number[],
): Promise<Map<number, LocalArchiveAggregateRow & { genres: SerialGenre[] }>> => {
  const rows = await SerialsArchiveRepository.getLocalArchiveAggregateRowsByTmdbIds(tmdbIds);

  return new Map(
    rows.map((row) => [
      row.tmdbId,
      {
        ...row,
        genres: normalizeSeriesGenres(row.genres),
      },
    ]),
  );
};

export const mapTmdbArchiveSeries = (
  tmdbSeries: TMDBDiscoverSeries,
  genreById: Map<number, TMDBSeriesGenre>,
  localAggregate: (LocalArchiveAggregateRow & { genres: SerialGenre[] }) | undefined,
): SerialArchiveItem => {
  const firstAirDate = localAggregate?.firstAirDate ?? toFirstAirDate(tmdbSeries.first_air_date);
  const firstAirYear = localAggregate?.firstAirYear ?? toFirstAirYear(firstAirDate);

  const genresFromTmdb = tmdbSeries.genre_ids
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
    .filter((genre): genre is SerialGenre => genre !== null);

  const genres =
    genresFromTmdb.length > 0 ? genresFromTmdb : (localAggregate?.genres ?? []);

  return {
    tmdbId: tmdbSeries.id,
    title: tmdbSeries.name,
    posterPath: tmdbSeries.poster_path,
    backdropPath: tmdbSeries.backdrop_path,
    firstAirDate,
    firstAirYear,
    creator: localAggregate?.creator ?? null,
    network: localAggregate?.network ?? null,
    languageCode:
      tmdbSeries.original_language.trim().length > 0
        ? tmdbSeries.original_language.toLowerCase()
        : (localAggregate?.languageCode ?? null),
    genres,
    primaryGenre: genres[0]?.name ?? null,
    logCount: localAggregate?.logCount ?? 0,
    avgRatingOutOfTen: localAggregate?.avgRatingOutOfTen ?? null,
    tmdbRatingOutOfTen: toTmdbRatingOutOfTen({
      voteAverage: tmdbSeries.vote_average,
      voteCount: tmdbSeries.vote_count,
    }),
    ratedLogCount: localAggregate?.ratedLogCount ?? 0,
    viewerHasLogged: false,
    viewerWatchlisted: false,
  };
};
