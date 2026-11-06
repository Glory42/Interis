import type { TMDBPersonCombinedCredits } from "../../../infrastructure/tmdb/people";
import type { PersonCreditItem } from "../types/people.types";
import { normalizeVoteAverage } from "../../media/helpers/media-vote-average.helper";
import type { MediaType } from "../../media/constants/media-type.constant";
import {
  toIsoDateOrNull,
  toNonNegativeIntOrNull,
  toNullableTrimmed,
  toYearOrNull,
} from "./people-text.utils";

type CreditMediaType = MediaType;

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

const joinUnique = (values: (string | null)[], separator: string): string | null => {
  const unique = [...new Set(values.filter((value): value is string => value !== null))];
  return unique.length > 0 ? unique.join(separator) : null;
};

// One row per title: TMDB lists a title once per character or job.
const mergeCreditsByTitle = (credits: PersonCreditItem[]): PersonCreditItem[] => {
  const byTitle = new Map<string, PersonCreditItem>();

  for (const credit of credits) {
    const key = `${credit.mediaType}:${credit.tmdbId}`;
    const existing = byTitle.get(key);
    if (!existing) {
      byTitle.set(key, credit);
      continue;
    }

    byTitle.set(key, {
      ...existing,
      character: joinUnique([existing.character, credit.character], " / "),
      jobs: [...new Set([...existing.jobs, ...credit.jobs])],
      episodeCount:
        existing.episodeCount === null && credit.episodeCount === null
          ? null
          : Math.max(existing.episodeCount ?? 0, credit.episodeCount ?? 0),
    });
  }

  return [...byTitle.values()];
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
    jobs: [toNullableTrimmed(input.job)].filter((job): job is string => job !== null),
    department: toNullableTrimmed(input.department),
    episodeCount: toNonNegativeIntOrNull(input.episodeCount),
    voteAverage: normalizeVoteAverage(input.voteAverage),
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
      cast: mergeCreditsByTitle(cast).sort(compareCreditsByRecency),
      crew: mergeCreditsByTitle(crew).sort(compareCreditsByRecency),
    };
  }
}
