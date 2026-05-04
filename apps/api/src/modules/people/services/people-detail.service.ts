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
} from "../../../infrastructure/tmdb/people";
import { normalizeKnownForDepartment } from "../helpers/people-slug.helper";
import { PeopleRepository } from "../repositories/people.repository";
import type { PersonDetailResponse, PersonRouteRole } from "../types/people.types";
import { PeopleCacheService } from "./people-cache.service";
import { PeopleCreditNormalizationService } from "./people-credit-normalization.service";
import { toIsoDateOrNull, toNullableTrimmed } from "./people-text.utils";

export class PeopleDetailService {
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

    const [combinedCredits, movieCredits, tvCredits, externalIds, images] =
      await Promise.all([
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

    const cachedPerson = await PeopleCacheService.upsertPersonCache({
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
        combined: PeopleCreditNormalizationService.normalizeCombinedCredits(combinedCredits),
        movies: PeopleCreditNormalizationService.normalizeMovieCredits(movieCredits),
        tv: PeopleCreditNormalizationService.normalizeTvCredits(tvCredits),
      },
    };
  }
}
