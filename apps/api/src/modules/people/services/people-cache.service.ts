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

type ExistingPersonRow = NonNullable<Awaited<ReturnType<typeof PeopleRepository.findByTmdbPersonId>>>;

export class PeopleCacheService {
  static async ensurePersonLinks(seeds: PersonLinkSeed[]): Promise<PersonLinkItem[]> {
    if (seeds.length === 0) {
      return [];
    }

    // Batch-fetch every cast/crew member's existing cache row in one query
    // instead of one findByTmdbPersonId per seed - this runs on every
    // movie/series detail page fetch, so an unbatched per-person lookup
    // multiplies into dozens of individual round trips per page view.
    const uniqueTmdbPersonIds = [...new Set(seeds.map((seed) => seed.tmdbPersonId))];
    const existingRows = await PeopleRepository.findByTmdbPersonIds(uniqueTmdbPersonIds);
    const existingByTmdbPersonId = new Map(existingRows.map((row) => [row.tmdbPersonId, row]));

    // One upsert per distinct tmdbPersonId, not per seed - the same person
    // can appear in multiple seeds (e.g. one actor playing two characters).
    // Upserting those concurrently against the same preloaded `existing`
    // snapshot races two inserts for the same not-yet-taken slug: Postgres's
    // ON CONFLICT(tmdb_person_id) only suppresses that one constraint, so the
    // second insert still throws on the separate slug unique constraint.
    const firstSeedByTmdbPersonId = new Map<number, PersonLinkSeed>();
    for (const seed of seeds) {
      if (!firstSeedByTmdbPersonId.has(seed.tmdbPersonId)) {
        firstSeedByTmdbPersonId.set(seed.tmdbPersonId, seed);
      }
    }

    const cachedPersonEntries = await Promise.all(
      [...firstSeedByTmdbPersonId.entries()].map(async ([tmdbPersonId, seed]) => {
        const cachedPerson = await PeopleCacheService.upsertPersonCache(
          {
            tmdbPersonId,
            name: seed.name,
            knownForDepartment: seed.knownForDepartment,
            profilePath: seed.profilePath,
            popularity: seed.popularity ?? null,
            routeRoleHints: [seed.routeRole],
          },
          existingByTmdbPersonId.get(tmdbPersonId) ?? null,
        );

        return cachedPerson ? ([tmdbPersonId, cachedPerson] as const) : null;
      }),
    );
    const cachedPersonByTmdbPersonId = new Map(
      cachedPersonEntries.filter((entry) => entry !== null),
    );

    const unique = new Map<string, PersonLinkItem>();

    for (const seed of seeds) {
      const normalizedName = toNullableTrimmed(seed.name);
      if (!Number.isInteger(seed.tmdbPersonId) || seed.tmdbPersonId <= 0 || !normalizedName) {
        continue;
      }

      const cachedPerson = cachedPersonByTmdbPersonId.get(seed.tmdbPersonId);
      if (!cachedPerson) {
        continue;
      }

      const link: PersonLinkItem = {
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

  static isPersonCacheUnchanged(
    existing: {
      name: string;
      knownForDepartment: string | null;
      profilePath: string | null;
      popularity: number | null;
      routeRoleHints: PersonRouteRole[];
    },
    incoming: {
      name: string;
      knownForDepartment: string | null;
      profilePath: string | null;
      popularity: number | null;
      routeRoleHints: PersonRouteRole[];
    },
  ): boolean {
    if (
      existing.name !== incoming.name ||
      existing.knownForDepartment !== incoming.knownForDepartment ||
      existing.profilePath !== incoming.profilePath ||
      existing.popularity !== incoming.popularity ||
      existing.routeRoleHints.length !== incoming.routeRoleHints.length
    ) {
      return false;
    }

    const existingRoleHints = [...existing.routeRoleHints].sort();
    const incomingRoleHints = [...incoming.routeRoleHints].sort();

    return existingRoleHints.every(
      (roleHint, index) => roleHint === incomingRoleHints[index],
    );
  }

  static async upsertPersonCache(
    input: {
      tmdbPersonId: number;
      name: string;
      knownForDepartment: string | null;
      routeRoleHints: PersonRouteRole[];
      profilePath: string | null;
      popularity: number | null;
    },
    preloadedExisting?: ExistingPersonRow | null,
  ) {
    const existing =
      preloadedExisting !== undefined
        ? preloadedExisting
        : await PeopleRepository.findByTmdbPersonId(input.tmdbPersonId);
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

    // Skip the slug-resolution + upsert + alias write chain entirely when
    // this person's cached data hasn't changed - this path runs for every
    // cast/crew member on every detail-page fetch, so a redundant write per
    // person adds up fast (see MoviesDetailService.getDetail).
    if (
      existing &&
      PeopleCacheService.isPersonCacheUnchanged(existing, {
        name: normalizedName,
        knownForDepartment: normalizedKnownForDepartment,
        profilePath: input.profilePath,
        popularity: input.popularity,
        routeRoleHints: mergedRoleHints,
      })
    ) {
      return existing;
    }

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
