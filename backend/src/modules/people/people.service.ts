import {
  getPersonCombinedCredits,
  getPersonDetails,
  getPersonExternalIds,
  getPersonImages,
  getPersonMovieCredits,
  getPersonTvCredits,
  type TMDBPersonCombinedCredits,
  type TMDBPersonMovieCredits,
  type TMDBPersonTvCredits,
} from "../../infrastructure/tmdb/people";
import {
  inferRoleHintsFromKnownForDepartment,
  mergeRoleHints,
  normalizeKnownForDepartment,
  slugifyPersonName,
} from "./helpers/people-slug.helper";
import { PeopleRepository } from "./repositories/people.repository";
import type {
  PersonCreditItem,
  PersonDetailResponse,
  PersonLinkItem,
  PersonRouteRole,
} from "./types/people.types";

type PersonLinkSeed = {
  tmdbPersonId: number;
  name: string;
  profilePath: string | null;
  knownForDepartment: string | null;
  popularity?: number | null;
  routeRole: PersonRouteRole;
  character?: string | null;
  job?: string | null;
  department?: string | null;
};

type CreditMediaType = "movie" | "tv";

const MAX_COMBINED_CREDITS = 120;
const MAX_MEDIA_CREDITS = 100;

const toNullableTrimmed = (value: string | null | undefined): string | null => {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toIsoDateOrNull = (value: string | null | undefined): string | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return value;
};

const toYearOrNull = (isoDate: string | null): number | null => {
  if (!isoDate) {
    return null;
  }

  const parsed = Number.parseInt(isoDate.slice(0, 4), 10);
  return Number.isNaN(parsed) ? null : parsed;
};

const toNonNegativeIntOrNull = (value: number | null | undefined): number | null => {
  if (value === null || value === undefined || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return Math.floor(value);
};

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

const normalizeCombinedCredits = (combinedCredits: TMDBPersonCombinedCredits) => {
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
};

const normalizeMovieCredits = (movieCredits: TMDBPersonMovieCredits) => {
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
};

const normalizeTvCredits = (tvCredits: TMDBPersonTvCredits) => {
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
};

export class PeopleService {
  static async ensurePersonLink(seed: PersonLinkSeed): Promise<PersonLinkItem | null> {
    if (!Number.isInteger(seed.tmdbPersonId) || seed.tmdbPersonId <= 0) {
      return null;
    }

    const normalizedName = toNullableTrimmed(seed.name);
    if (!normalizedName) {
      return null;
    }

    const cachedPerson = await PeopleService.upsertPersonCache({
      tmdbPersonId: seed.tmdbPersonId,
      name: normalizedName,
      knownForDepartment: normalizeKnownForDepartment(seed.knownForDepartment),
      profilePath: seed.profilePath,
      popularity: seed.popularity ?? null,
      routeRoleHints: [seed.routeRole],
    });

    if (!cachedPerson) {
      return null;
    }

    return {
      tmdbPersonId: cachedPerson.tmdbPersonId,
      slug: cachedPerson.slug,
      name: cachedPerson.name,
      profilePath: cachedPerson.profilePath,
      knownForDepartment: cachedPerson.knownForDepartment,
      routeRole: seed.routeRole,
      character: toNullableTrimmed(seed.character),
      job: toNullableTrimmed(seed.job),
      department: toNullableTrimmed(seed.department),
    };
  }

  static async ensurePersonLinks(seeds: PersonLinkSeed[]): Promise<PersonLinkItem[]> {
    if (seeds.length === 0) {
      return [];
    }

    const links = await Promise.all(seeds.map((seed) => PeopleService.ensurePersonLink(seed)));
    const unique = new Map<string, PersonLinkItem>();

    for (const link of links) {
      if (!link) {
        continue;
      }

      const key = [
        String(link.tmdbPersonId),
        link.routeRole,
        link.character ?? "",
        link.job ?? "",
        link.department ?? "",
      ].join(":");

      if (!unique.has(key)) {
        unique.set(key, link);
      }
    }

    return [...unique.values()];
  }

  static async getPersonDetailByRoleAndSlug(input: {
    role: PersonRouteRole;
    slug: string;
  }): Promise<PersonDetailResponse | null> {
    const resolved = await PeopleRepository.findByCanonicalOrAliasSlug(input.slug);
    if (!resolved) {
      return null;
    }

    const tmdbPersonId = resolved.person.tmdbPersonId;

    const detail = await getPersonDetails(tmdbPersonId).catch(() => null);
    if (!detail) {
      return null;
    }

    const [combinedCredits, movieCredits, tvCredits, externalIds, images] = await Promise.all([
      getPersonCombinedCredits(tmdbPersonId).catch(
        () => ({ cast: [], crew: [] }) as TMDBPersonCombinedCredits,
      ),
      getPersonMovieCredits(tmdbPersonId).catch(
        () => ({ cast: [], crew: [] }) as TMDBPersonMovieCredits,
      ),
      getPersonTvCredits(tmdbPersonId).catch(
        () => ({ cast: [], crew: [] }) as TMDBPersonTvCredits,
      ),
      getPersonExternalIds(tmdbPersonId).catch(() => ({
        imdb_id: detail.imdb_id,
        facebook_id: null,
        instagram_id: null,
        twitter_id: null,
        wikidata_id: null,
        tiktok_id: null,
        youtube_id: null,
      })),
      getPersonImages(tmdbPersonId).catch(() => ({ profiles: [] })),
    ]);

    const cachedPerson = await PeopleService.upsertPersonCache({
      tmdbPersonId: detail.id,
      name: detail.name,
      knownForDepartment: normalizeKnownForDepartment(detail.known_for_department),
      profilePath: detail.profile_path,
      popularity: detail.popularity,
      routeRoleHints: [input.role],
    });

    if (!cachedPerson) {
      return null;
    }

    const actorPath = `/actor/${cachedPerson.slug}`;
    const directorPath = `/director/${cachedPerson.slug}`;
    const requestedPath = input.role === "actor" ? actorPath : directorPath;

    return {
      person: {
        tmdbPersonId: cachedPerson.tmdbPersonId,
        slug: cachedPerson.slug,
        name: cachedPerson.name,
        knownForDepartment: cachedPerson.knownForDepartment,
        profilePath: cachedPerson.profilePath,
        biography: toNullableTrimmed(detail.biography),
        birthday: toIsoDateOrNull(detail.birthday),
        deathday: toIsoDateOrNull(detail.deathday),
        placeOfBirth: toNullableTrimmed(detail.place_of_birth),
        popularity:
          Number.isFinite(detail.popularity) && detail.popularity > 0
            ? Number(detail.popularity.toFixed(1))
            : null,
        homepage: toNullableTrimmed(detail.homepage),
        alsoKnownAs: detail.also_known_as
          .map((alias) => alias.trim())
          .filter((alias) => alias.length > 0),
        roleHints: cachedPerson.routeRoleHints,
        externalIds: {
          imdbId: toNullableTrimmed(externalIds.imdb_id ?? detail.imdb_id),
          facebookId: toNullableTrimmed(externalIds.facebook_id),
          instagramId: toNullableTrimmed(externalIds.instagram_id),
          twitterId: toNullableTrimmed(externalIds.twitter_id),
          wikidataId: toNullableTrimmed(externalIds.wikidata_id),
          tiktokId: toNullableTrimmed(externalIds.tiktok_id),
          youtubeId: toNullableTrimmed(externalIds.youtube_id),
        },
        images: {
          profiles: images.profiles.slice(0, 24).map((profileImage) => ({
            filePath: profileImage.file_path,
            width: profileImage.width,
            height: profileImage.height,
            voteAverage: profileImage.vote_average,
            voteCount: profileImage.vote_count,
          })),
        },
        canonicalRoute: {
          requestedRole: input.role,
          requestedPath,
          actorPath,
          directorPath,
          isCanonicalSlug: input.slug === cachedPerson.slug,
        },
      },
      credits: {
        combined: normalizeCombinedCredits(combinedCredits),
        movies: normalizeMovieCredits(movieCredits),
        tv: normalizeTvCredits(tvCredits),
      },
    };
  }

  private static async resolveCanonicalSlug(
    baseSlug: string,
    tmdbPersonId: number,
  ): Promise<string> {
    let candidateSlug = baseSlug;
    const disambiguatedBaseSlug = `${baseSlug}-${tmdbPersonId}`;

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const ownerTmdbPersonId = await PeopleRepository.findSlugOwnerTmdbId(candidateSlug);

      if (ownerTmdbPersonId === null || ownerTmdbPersonId === tmdbPersonId) {
        return candidateSlug;
      }

      candidateSlug =
        attempt === 0 ? disambiguatedBaseSlug : `${disambiguatedBaseSlug}-${attempt}`;
    }

    return `${disambiguatedBaseSlug}-${Date.now().toString(36)}`;
  }

  private static async upsertPersonCache(input: {
    tmdbPersonId: number;
    name: string;
    knownForDepartment: string | null;
    routeRoleHints: PersonRouteRole[];
    profilePath: string | null;
    popularity: number | null;
  }) {
    const existing = await PeopleRepository.findByTmdbPersonId(input.tmdbPersonId);
    const normalizedName = toNullableTrimmed(input.name) ?? existing?.name ?? null;

    if (!normalizedName) {
      return null;
    }

    const normalizedKnownForDepartment =
      normalizeKnownForDepartment(input.knownForDepartment) ??
      existing?.knownForDepartment ??
      null;

    const mergedRoleHints = mergeRoleHints(
      existing?.routeRoleHints ?? [],
      input.routeRoleHints,
      inferRoleHintsFromKnownForDepartment(normalizedKnownForDepartment),
    );

    const baseSlug = slugifyPersonName(normalizedName);
    const canonicalSlug = await PeopleService.resolveCanonicalSlug(baseSlug, input.tmdbPersonId);

    const upserted = await PeopleRepository.upsertPerson({
      tmdbPersonId: input.tmdbPersonId,
      slug: canonicalSlug,
      name: normalizedName,
      knownForDepartment: normalizedKnownForDepartment,
      routeRoleHints: mergedRoleHints,
      profilePath: input.profilePath,
      popularity: input.popularity,
    });

    if (!upserted) {
      return null;
    }

    if (existing && existing.slug !== upserted.slug) {
      await PeopleRepository.insertSlugAlias(upserted.id, existing.slug);
    }

    await PeopleRepository.deleteAliasForPersonSlug(upserted.id, upserted.slug);

    return upserted;
  }
}

export type { PersonLinkSeed };
