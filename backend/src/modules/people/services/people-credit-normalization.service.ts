import type {
  TMDBPersonCombinedCredits,
  TMDBPersonMovieCredits,
  TMDBPersonTvCredits,
} from "../../../infrastructure/tmdb/people";
import type { PersonCreditItem } from "../types/people.types";
import {
  toIsoDateOrNull,
  toNonNegativeIntOrNull,
  toNullableTrimmed,
  toYearOrNull,
} from "./people-text.utils";

type CreditMediaType = "movie" | "tv";

const MAX_COMBINED_CREDITS = 120;
const MAX_MEDIA_CREDITS = 100;

const pickTitle = (
  mediaType: CreditMediaType,
  title: string | null,
  name: string | null,
): string => {
  if (mediaType === "movie") {
    return title ?? name ?? "Untitled";
  }

  return name ?? title ?? "Untitled";
};

const pickOriginalTitle = (
  mediaType: CreditMediaType,
  originalTitle: string | null,
  originalName: string | null,
): string | null => {
  if (mediaType === "movie") {
    return originalTitle ?? originalName ?? null;
  }

  return originalName ?? originalTitle ?? null;
};

const toReleaseDate = (
  mediaType: CreditMediaType,
  releaseDate: string | null,
  firstAirDate: string | null,
): string | null => {
  if (mediaType === "movie") {
    return releaseDate;
  }

  return firstAirDate;
};

const compareCreditsByRecency = (
  leftCredit: PersonCreditItem,
  rightCredit: PersonCreditItem,
): number => {
  const leftTimestamp = leftCredit.releaseDate
    ? Date.parse(leftCredit.releaseDate)
    : Number.NEGATIVE_INFINITY;
  const rightTimestamp = rightCredit.releaseDate
    ? Date.parse(rightCredit.releaseDate)
    : Number.NEGATIVE_INFINITY;

  if (rightTimestamp !== leftTimestamp) {
    return rightTimestamp - leftTimestamp;
  }

  const leftVoteCount = leftCredit.voteCount ?? 0;
  const rightVoteCount = rightCredit.voteCount ?? 0;

  if (rightVoteCount !== leftVoteCount) {
    return rightVoteCount - leftVoteCount;
  }

  return rightCredit.tmdbId - leftCredit.tmdbId;
};

const dedupeCredits = (credits: PersonCreditItem[]): PersonCreditItem[] => {
  const seen = new Set<string>();
  const deduped: PersonCreditItem[] = [];

  for (const credit of credits) {
    const key = [
      credit.mediaType,
      String(credit.tmdbId),
      credit.character ?? "",
      credit.job ?? "",
      credit.department ?? "",
    ].join(":");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(credit);
  }

  return deduped;
};

const toCreditItem = (input: {
  mediaType: CreditMediaType;
  tmdbId: number;
  title: string | null;
  name: string | null;
  originalTitle: string | null;
  originalName: string | null;
  releaseDate: string | null;
  firstAirDate: string | null;
  posterPath: string | null;
  backdropPath: string | null;
  character: string | null;
  job: string | null;
  department: string | null;
  episodeCount: number | null;
  voteAverage: number | null;
  voteCount: number | null;
}): PersonCreditItem => {
  const normalizedReleaseDate = toReleaseDate(
    input.mediaType,
    toIsoDateOrNull(input.releaseDate),
    toIsoDateOrNull(input.firstAirDate),
  );

  return {
    mediaType: input.mediaType,
    tmdbId: input.tmdbId,
    title: pickTitle(input.mediaType, input.title, input.name),
    originalTitle: pickOriginalTitle(
      input.mediaType,
      input.originalTitle,
      input.originalName,
    ),
    posterPath: input.posterPath,
    backdropPath: input.backdropPath,
    releaseDate: normalizedReleaseDate,
    releaseYear: toYearOrNull(normalizedReleaseDate),
    character: toNullableTrimmed(input.character),
    job: toNullableTrimmed(input.job),
    department: toNullableTrimmed(input.department),
    episodeCount: toNonNegativeIntOrNull(input.episodeCount),
    voteAverage:
      input.voteAverage !== null && input.voteAverage !== undefined
        ? Number(input.voteAverage.toFixed(1))
        : null,
    voteCount: toNonNegativeIntOrNull(input.voteCount),
  };
};

export class PeopleCreditNormalizationService {
  static normalizeCombinedCredits(combinedCredits: TMDBPersonCombinedCredits) {
    const cast = combinedCredits.cast.map((credit) =>
      toCreditItem({
        mediaType: credit.media_type,
        tmdbId: credit.id,
        title: toNullableTrimmed(credit.title),
        name: toNullableTrimmed(credit.name),
        originalTitle: toNullableTrimmed(credit.original_title),
        originalName: toNullableTrimmed(credit.original_name),
        releaseDate: toNullableTrimmed(credit.release_date),
        firstAirDate: toNullableTrimmed(credit.first_air_date),
        posterPath: credit.poster_path,
        backdropPath: credit.backdrop_path,
        character: toNullableTrimmed(credit.character),
        job: null,
        department: null,
        episodeCount: credit.episode_count,
        voteAverage: credit.vote_average,
        voteCount: credit.vote_count,
      }),
    );

    const crew = combinedCredits.crew.map((credit) =>
      toCreditItem({
        mediaType: credit.media_type,
        tmdbId: credit.id,
        title: toNullableTrimmed(credit.title),
        name: toNullableTrimmed(credit.name),
        originalTitle: toNullableTrimmed(credit.original_title),
        originalName: toNullableTrimmed(credit.original_name),
        releaseDate: toNullableTrimmed(credit.release_date),
        firstAirDate: toNullableTrimmed(credit.first_air_date),
        posterPath: credit.poster_path,
        backdropPath: credit.backdrop_path,
        character: null,
        job: toNullableTrimmed(credit.job),
        department: toNullableTrimmed(credit.department),
        episodeCount: credit.episode_count,
        voteAverage: credit.vote_average,
        voteCount: credit.vote_count,
      }),
    );

    return {
      cast: dedupeCredits(cast).sort(compareCreditsByRecency).slice(0, MAX_COMBINED_CREDITS),
      crew: dedupeCredits(crew).sort(compareCreditsByRecency).slice(0, MAX_COMBINED_CREDITS),
    };
  }

  static normalizeMovieCredits(movieCredits: TMDBPersonMovieCredits) {
    const cast = movieCredits.cast.map((credit) =>
      toCreditItem({
        mediaType: "movie",
        tmdbId: credit.id,
        title: toNullableTrimmed(credit.title),
        name: null,
        originalTitle: toNullableTrimmed(credit.original_title),
        originalName: null,
        releaseDate: toNullableTrimmed(credit.release_date),
        firstAirDate: null,
        posterPath: credit.poster_path,
        backdropPath: credit.backdrop_path,
        character: toNullableTrimmed(credit.character),
        job: null,
        department: null,
        episodeCount: null,
        voteAverage: credit.vote_average,
        voteCount: credit.vote_count,
      }),
    );

    const crew = movieCredits.crew.map((credit) =>
      toCreditItem({
        mediaType: "movie",
        tmdbId: credit.id,
        title: toNullableTrimmed(credit.title),
        name: null,
        originalTitle: toNullableTrimmed(credit.original_title),
        originalName: null,
        releaseDate: toNullableTrimmed(credit.release_date),
        firstAirDate: null,
        posterPath: credit.poster_path,
        backdropPath: credit.backdrop_path,
        character: null,
        job: toNullableTrimmed(credit.job),
        department: toNullableTrimmed(credit.department),
        episodeCount: null,
        voteAverage: credit.vote_average,
        voteCount: credit.vote_count,
      }),
    );

    return {
      cast: dedupeCredits(cast).sort(compareCreditsByRecency).slice(0, MAX_MEDIA_CREDITS),
      crew: dedupeCredits(crew).sort(compareCreditsByRecency).slice(0, MAX_MEDIA_CREDITS),
    };
  }

  static normalizeTvCredits(tvCredits: TMDBPersonTvCredits) {
    const cast = tvCredits.cast.map((credit) =>
      toCreditItem({
        mediaType: "tv",
        tmdbId: credit.id,
        title: null,
        name: toNullableTrimmed(credit.name),
        originalTitle: null,
        originalName: toNullableTrimmed(credit.original_name),
        releaseDate: null,
        firstAirDate: toNullableTrimmed(credit.first_air_date),
        posterPath: credit.poster_path,
        backdropPath: credit.backdrop_path,
        character: toNullableTrimmed(credit.character),
        job: null,
        department: null,
        episodeCount: credit.episode_count,
        voteAverage: credit.vote_average,
        voteCount: credit.vote_count,
      }),
    );

    const crew = tvCredits.crew.map((credit) =>
      toCreditItem({
        mediaType: "tv",
        tmdbId: credit.id,
        title: null,
        name: toNullableTrimmed(credit.name),
        originalTitle: null,
        originalName: toNullableTrimmed(credit.original_name),
        releaseDate: null,
        firstAirDate: toNullableTrimmed(credit.first_air_date),
        posterPath: credit.poster_path,
        backdropPath: credit.backdrop_path,
        character: null,
        job: toNullableTrimmed(credit.job),
        department: toNullableTrimmed(credit.department),
        episodeCount: credit.episode_count,
        voteAverage: credit.vote_average,
        voteCount: credit.vote_count,
      }),
    );

    return {
      cast: dedupeCredits(cast).sort(compareCreditsByRecency).slice(0, MAX_MEDIA_CREDITS),
      crew: dedupeCredits(crew).sort(compareCreditsByRecency).slice(0, MAX_MEDIA_CREDITS),
    };
  }
}
