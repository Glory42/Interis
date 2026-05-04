import { and, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { people, personSlugAliases } from "../people.entity";
import type { PersonRouteRole } from "../types/people.types";

export class PeopleRepository {
  static async findByTmdbPersonId(tmdbPersonId: number) {
    const [row] = await db
      .select()
      .from(people)
      .where(eq(people.tmdbPersonId, tmdbPersonId))
      .limit(1);

    return row ?? null;
  }

  static async findByCanonicalSlug(slug: string) {
    const [row] = await db
      .select()
      .from(people)
      .where(eq(people.slug, slug))
      .limit(1);

    return row ?? null;
  }

  static async findByAliasSlug(slug: string) {
    const [row] = await db
      .select({ person: people })
      .from(personSlugAliases)
      .innerJoin(people, eq(personSlugAliases.personId, people.id))
      .where(eq(personSlugAliases.slug, slug))
      .limit(1);

    return row?.person ?? null;
  }

  static async findByCanonicalOrAliasSlug(slug: string) {
    const canonical = await PeopleRepository.findByCanonicalSlug(slug);
    if (canonical) {
      return {
        person: canonical,
        matchedAlias: false,
      };
    }

    const aliasPerson = await PeopleRepository.findByAliasSlug(slug);
    if (!aliasPerson) {
      return null;
    }

    return {
      person: aliasPerson,
      matchedAlias: true,
    };
  }

  static async findSlugOwnerTmdbId(slug: string): Promise<number | null> {
    const canonical = await PeopleRepository.findByCanonicalSlug(slug);
    if (canonical) {
      return canonical.tmdbPersonId;
    }

    const aliasPerson = await PeopleRepository.findByAliasSlug(slug);
    return aliasPerson?.tmdbPersonId ?? null;
  }

  static async upsertPerson(input: {
    tmdbPersonId: number;
    slug: string;
    name: string;
    knownForDepartment: string | null;
    routeRoleHints: PersonRouteRole[];
    profilePath: string | null;
    popularity: number | null;
  }) {
    const [upserted] = await db
      .insert(people)
      .values({
        tmdbPersonId: input.tmdbPersonId,
        slug: input.slug,
        name: input.name,
        knownForDepartment: input.knownForDepartment,
        routeRoleHints: input.routeRoleHints,
        profilePath: input.profilePath,
        popularity: input.popularity,
      })
      .onConflictDoUpdate({
        target: people.tmdbPersonId,
        set: {
          slug: input.slug,
          name: input.name,
          knownForDepartment: input.knownForDepartment,
          routeRoleHints: input.routeRoleHints,
          profilePath: input.profilePath,
          popularity: input.popularity,
          cachedAt: new Date(),
          updatedAt: new Date(),
        },
      })
      .returning();

    return upserted ?? null;
  }

  static async insertSlugAlias(personId: number, slug: string): Promise<void> {
    await db
      .insert(personSlugAliases)
      .values({
        personId,
        slug,
      })
      .onConflictDoNothing();
  }

  static async deleteAliasForPersonSlug(personId: number, slug: string): Promise<void> {
    await db
      .delete(personSlugAliases)
      .where(
        and(eq(personSlugAliases.personId, personId), eq(personSlugAliases.slug, slug)),
      );
  }
}
