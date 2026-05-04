import type {
  TMDBSeriesDetail,
  TMDBSeriesSeasonDetail,
} from "../../../infrastructure/tmdb/serials";
import type {
  SerialDetailEpisode,
  SerialDetailSeason,
  SerialSeasonDetailResponse,
  SerialGenre,
} from "../types/serials.types";

type NameLike = {
  name: string;
};

const toIsoDate = (rawDate: string | null | undefined): string | null => {
  if (!rawDate || !/^\d{4}-\d{2}-\d{2}$/.test(rawDate)) {
    return null;
  }

  return rawDate;
};

const toYear = (isoDate: string | null): number | null => {
  if (!isoDate) {
    return null;
  }

  const parsedYear = Number.parseInt(isoDate.slice(0, 4), 10);
  return Number.isNaN(parsedYear) ? null : parsedYear;
};

const toNullableTrimmedText = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toPrimaryName = (values: NameLike[]): string | null => {
  for (const value of values) {
    const normalized = toNullableTrimmedText(value.name);
    if (normalized) {
      return normalized;
    }
  }

  return null;
};

const toPrimaryEpisodeRuntime = (episodeRunTimes: number[]): number | null => {
  for (const runtime of episodeRunTimes) {
    if (Number.isFinite(runtime) && runtime > 0) {
      return Math.floor(runtime);
    }
  }

  return null;
};

const toNonNegativeIntegerOrNull = (value: number | null): number | null => {
  if (value === null || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.floor(value);
};

const toNullableTrimmedTextFromNullable = (
  value: string | null | undefined,
): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const SERIAL_NORMALIZATION_CONTRACT = {
  title: "TMDB tv.name",
  firstAirDate: "TMDB tv.first_air_date",
  episodeRuntime: "First positive TMDB tv.episode_run_time entry",
  creator: "First TMDB tv.created_by.name value",
  network: "First TMDB tv.networks.name value",
} as const;

export const normalizeSeriesGenres = (rawGenres: unknown): SerialGenre[] => {
  if (!Array.isArray(rawGenres)) {
    return [];
  }

  return rawGenres
    .map((genre) => {
      if (!genre || typeof genre !== "object") {
        return null;
      }

      const maybeId = (genre as { id?: unknown }).id;
      const maybeName = (genre as { name?: unknown }).name;

      if (typeof maybeId !== "number" || typeof maybeName !== "string") {
        return null;
      }

      return {
        id: maybeId,
        name: maybeName,
      };
    })
    .filter((genre): genre is SerialGenre => genre !== null);
};

export const normalizeTmdbSeriesDetail = (detail: TMDBSeriesDetail) => {
  const firstAirDate = toIsoDate(detail.first_air_date);
  const lastAirDate = toIsoDate(detail.last_air_date);

  return {
    tmdbId: detail.id,
    title: detail.name,
    originalTitle: toNullableTrimmedText(detail.original_name),
    posterPath: detail.poster_path,
    backdropPath: detail.backdrop_path,
    firstAirDate,
    firstAirYear: toYear(firstAirDate),
    lastAirDate,
    creator: toPrimaryName(detail.created_by),
    network: toPrimaryName(detail.networks),
    episodeRuntime: toPrimaryEpisodeRuntime(detail.episode_run_time),
    numberOfSeasons: toNonNegativeIntegerOrNull(detail.number_of_seasons),
    numberOfEpisodes: toNonNegativeIntegerOrNull(detail.number_of_episodes),
    status: toNullableTrimmedText(detail.status),
    overview: toNullableTrimmedText(detail.overview),
    tagline: toNullableTrimmedText(detail.tagline),
    languageCode: toNullableTrimmedText(detail.original_language)?.toLowerCase() ?? null,
    genres: detail.genres,
  };
};

export const toNormalizedSeasonItems = (
  detail: TMDBSeriesDetail,
): SerialDetailSeason[] => {
  return detail.seasons
    .map((season) => ({
      id: season.id,
      seasonNumber: season.season_number,
      name: season.name,
      episodeCount: toNonNegativeIntegerOrNull(season.episode_count),
      airDate: toIsoDate(season.air_date),
      posterPath: season.poster_path,
    }))
    .sort((leftSeason, rightSeason) => leftSeason.seasonNumber - rightSeason.seasonNumber);
};

export const toRatingOutOfFive = (ratingOutOfTen: number | null): number | null => {
  if (ratingOutOfTen === null || !Number.isFinite(ratingOutOfTen)) {
    return null;
  }

  return Math.max(0, Math.min(5, ratingOutOfTen / 2));
};

export const toTmdbRatingOutOfTen = (input: {
  voteAverage: number;
  voteCount: number;
}): number | null => {
  if (input.voteCount <= 0 || !Number.isFinite(input.voteAverage)) {
    return null;
  }

  return Number(input.voteAverage.toFixed(1));
};

export const toRatingBreakdownBucket = (ratingOutOfTen: number): 1 | 2 | 3 | 4 | 5 => {
  const normalized = Math.round(Math.max(1, Math.min(10, ratingOutOfTen)) / 2);
  return Math.max(1, Math.min(5, normalized)) as 1 | 2 | 3 | 4 | 5;
};

const toEpisodeRuntimeLabel = (runtimeMinutes: number | null | undefined): string | null => {
  if (
    runtimeMinutes === null ||
    runtimeMinutes === undefined ||
    !Number.isFinite(runtimeMinutes) ||
    runtimeMinutes <= 0
  ) {
    return null;
  }

  return `${Math.floor(runtimeMinutes)} min`;
};

export const toNormalizedSeasonEpisodeItems = (
  seasonDetail: TMDBSeriesSeasonDetail,
): SerialDetailEpisode[] => {
  return seasonDetail.episodes
    .map((episode) => ({
      id: episode.id,
      seasonNumber: episode.season_number,
      episodeNumber: episode.episode_number,
      name: toNullableTrimmedTextFromNullable(episode.name) ?? `Episode ${episode.episode_number}`,
      overview: toNullableTrimmedTextFromNullable(episode.overview),
      airDate: toIsoDate(episode.air_date),
      stillPath: episode.still_path,
      runtimeMinutes: toNonNegativeIntegerOrNull(episode.runtime ?? null),
      runtimeLabel: toEpisodeRuntimeLabel(episode.runtime),
    }))
    .sort((leftEpisode, rightEpisode) => leftEpisode.episodeNumber - rightEpisode.episodeNumber);
};

export const toNormalizedSeasonDetail = (
  tmdbId: number,
  seasonDetail: TMDBSeriesSeasonDetail,
): SerialSeasonDetailResponse => {
  return {
    tmdbId,
    season: {
      id: seasonDetail.id,
      seasonNumber: seasonDetail.season_number,
      name: toNullableTrimmedTextFromNullable(seasonDetail.name) ?? `Season ${seasonDetail.season_number}`,
      overview: toNullableTrimmedTextFromNullable(seasonDetail.overview),
      airDate: toIsoDate(seasonDetail.air_date),
      posterPath: seasonDetail.poster_path,
      episodeCount: seasonDetail.episodes.length,
    },
    episodes: toNormalizedSeasonEpisodeItems(seasonDetail),
  };
};
