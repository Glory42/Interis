import {
  inferRoleHintsFromKnownForDepartment,
  mergeRoleHints,
  normalizeKnownForDepartment,
  slugifyPersonName,
} from "../helpers/people-slug.helper";
import { PeopleRepository } from "../repositories/people.repository";
import type { PersonLinkItem, PersonRouteRole } from "../types/people.types";
import { toNullableTrimmed } from "./people-text.utils";

export type PersonLinkSeed = {
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

export class PeopleCacheService {
  static async ensurePersonLink(seed: PersonLinkSeed): Promise<PersonLinkItem | null> {
    if (!Number.isInteger(seed.tmdbPersonId) || seed.tmdbPersonId <= 0) {
      return null;
    }

    const normalizedName = toNullableTrimmed(seed.name);
    if (!normalizedName) {
      return null;
    }

    const cachedPerson = await PeopleCacheService.upsertPersonCache({
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

    const links = await Promise.all(
      seeds.map((seed) => PeopleCacheService.ensurePersonLink(seed)),
    );
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

  static async resolveCanonicalSlug(
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

  static async upsertPersonCache(input: {
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
    const canonicalSlug = await PeopleCacheService.resolveCanonicalSlug(
      baseSlug,
      input.tmdbPersonId,
    );

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
