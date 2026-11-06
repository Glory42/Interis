import {
  getPersonCombinedCredits,
  getPersonDetails,
  getPersonExternalIds,
  getPersonImages,
  type TMDBPersonExternalIds,
} from "../../../infrastructure/tmdb/people";
import type { PersonCreditsQuery } from "../dto/people.dto";
import {
  countPersonCredits,
  countPersonJobs,
  selectKnownFor,
  selectPersonCredits,
  splitBiographySource,
  type NormalizedPersonCredits,
} from "../helpers/people-credits.helper";
import { normalizeKnownForDepartment } from "../helpers/people-slug.helper";
import { PeopleRepository } from "../repositories/people.repository";
import type {
  PersonCreditsPage,
  PersonDetailResponse,
  PersonRouteRole,
} from "../types/people.types";
import { PeopleCacheService } from "./people-cache.service";
import { PeopleCreditNormalizationService } from "./people-credit-normalization.service";
import { toIsoDateOrNull, toNullableTrimmed } from "./people-text.utils";

const EMPTY_EXTERNAL_IDS: TMDBPersonExternalIds = {
  imdb_id: null,
  facebook_id: null,
  instagram_id: null,
  twitter_id: null,
  wikidata_id: null,
  tiktok_id: null,
  youtube_id: null,
};

const loadNormalizedCredits = async (tmdbPersonId: number): Promise<NormalizedPersonCredits> => {
  const combinedCredits = await getPersonCombinedCredits(tmdbPersonId).catch(() => null);
  return combinedCredits
    ? PeopleCreditNormalizationService.normalizeCombinedCredits(combinedCredits)
    : { cast: [], crew: [] };
};

export class PeopleDetailService {
  static async getPersonCredits(
    slug: string,
    query: PersonCreditsQuery,
  ): Promise<PersonCreditsPage | null> {
    const resolved = await PeopleRepository.findByCanonicalOrAliasSlug(slug);
    if (!resolved) {
      return null;
    }

    const credits = await loadNormalizedCredits(resolved.person.tmdbPersonId);
    const selected = selectPersonCredits(credits, query);

    return {
      items: selected.slice(query.offset, query.offset + query.limit),
      total: selected.length,
    };
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

    const [detail, credits, externalIds, images] = await Promise.all([
      getPersonDetails(tmdbPersonId).catch(() => null),
      loadNormalizedCredits(tmdbPersonId),
      getPersonExternalIds(tmdbPersonId).catch(() => EMPTY_EXTERNAL_IDS),
      getPersonImages(tmdbPersonId).catch(() => ({ profiles: [] })),
    ]);
    if (!detail) {
      return null;
    }

    const cachedPerson = await PeopleCacheService.upsertPersonCache({
      tmdbPersonId: detail.id,
      name: detail.name,
      knownForDepartment: normalizeKnownForDepartment(detail.known_for_department),
      profilePath: detail.profile_path,
      popularity: detail.popularity,
      routeRoleHints: [input.role],
    }, resolved.person);

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
        ...splitBiographySource(toNullableTrimmed(detail.biography)),
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
      knownFor: selectKnownFor(credits),
      credits: {
        counts: countPersonCredits(credits),
        jobCounts: countPersonJobs(credits.crew),
      },
    };
  }
}
