import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomInt } from "node:crypto";
import { PeopleCacheService } from "../../../src/modules/people/services/people-cache.service";
import { PeopleRepository } from "../../../src/modules/people/repositories/people.repository";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

// PeopleCacheService is pure DB CRUD (no TMDB network calls), so it's
// exercised directly here rather than through an HTTP route — the only
// route (`GET /:role/:slug`) is a read path that doesn't populate the
// cache; population happens as a side effect of movie/series detail
// fetches, which require real TMDB data this suite doesn't have.
describe("PeopleCacheService", () => {
  let testServer: RunningTestServer | null = null;

  beforeAll(async () => {
    // Only used to get the app (and its DB connection) initialized the
    // same way every other integration test does.
    testServer = await startTestServer();
  });

  afterAll(async () => {
    if (!testServer) return;
    await testServer.close();
    testServer = null;
  });

  const randomTmdbPersonId = (): number => randomInt(1_000_000, 999_000_000);
  // Names must be unique per test run, not just per test — slugs are
  // derived from the name alone, so a fixed literal like "Jane Doe" would
  // collide with a leftover row from a prior local run against this same
  // (not reset-between-runs) test database.
  const uniqueName = (base: string): string => `${base} ${randomInt(100_000, 999_999)}`;

  describe("upsertPersonCache", () => {
    it("creates a new person with a slugified name", async () => {
      const tmdbPersonId = randomTmdbPersonId();
      const name = uniqueName("Jane Doe");
      const person = await PeopleCacheService.upsertPersonCache({
        tmdbPersonId,
        name,
        knownForDepartment: "Acting",
        routeRoleHints: ["actor"],
        profilePath: "/jane.jpg",
        popularity: 12.5,
      });

      expect(person?.slug).toBe(name.toLowerCase().replace(/ /g, "-"));
      expect(person?.tmdbPersonId).toBe(tmdbPersonId);
      expect(person?.routeRoleHints).toEqual(["actor"]);
    });

    it("skips the write entirely when nothing changed", async () => {
      const tmdbPersonId = randomTmdbPersonId();
      const input = {
        tmdbPersonId,
        name: uniqueName("Stable Person"),
        knownForDepartment: "Acting",
        routeRoleHints: ["actor"] as const,
        profilePath: "/stable.jpg",
        popularity: 5,
      };

      const first = await PeopleCacheService.upsertPersonCache({
        ...input,
        routeRoleHints: [...input.routeRoleHints],
      });
      const second = await PeopleCacheService.upsertPersonCache({
        ...input,
        routeRoleHints: [...input.routeRoleHints],
      });

      expect(second?.id).toBe(first!.id);
      expect(second?.slug).toBe(first!.slug);
    });

    it("merges role hints across acting and directing without duplicating", async () => {
      const tmdbPersonId = randomTmdbPersonId();
      const name = uniqueName("Dual Role Person");
      await PeopleCacheService.upsertPersonCache({
        tmdbPersonId,
        name,
        knownForDepartment: "Acting",
        routeRoleHints: ["actor"],
        profilePath: null,
        popularity: null,
      });

      const updated = await PeopleCacheService.upsertPersonCache({
        tmdbPersonId,
        name,
        knownForDepartment: "Directing",
        routeRoleHints: ["director"],
        profilePath: null,
        popularity: null,
      });

      expect([...updated!.routeRoleHints].sort()).toEqual(["actor", "director"]);
    });
  });

  describe("resolveCanonicalSlug", () => {
    it("disambiguates two different people whose names slugify identically", async () => {
      const firstId = randomTmdbPersonId();
      const secondId = randomTmdbPersonId();
      const sharedName = uniqueName("John Smith");
      const baseSlug = sharedName.toLowerCase().replace(/ /g, "-");

      const first = await PeopleCacheService.upsertPersonCache({
        tmdbPersonId: firstId,
        name: sharedName,
        knownForDepartment: null,
        routeRoleHints: ["actor"],
        profilePath: null,
        popularity: null,
      });
      const second = await PeopleCacheService.upsertPersonCache({
        tmdbPersonId: secondId,
        name: sharedName,
        knownForDepartment: null,
        routeRoleHints: ["actor"],
        profilePath: null,
        popularity: null,
      });

      expect(first?.slug).toBe(baseSlug);
      expect(second?.slug).toBe(`${baseSlug}-${secondId}`);
      expect(second?.slug).not.toBe(first?.slug);
    });

    it("keeps returning the same slug for its own owner across repeated calls", async () => {
      const tmdbPersonId = randomTmdbPersonId();
      const baseSlug = `recurring-name-${randomInt(100_000, 999_999)}`;
      const slug = await PeopleCacheService.resolveCanonicalSlug(baseSlug, tmdbPersonId);
      const owner = await PeopleRepository.findSlugOwnerTmdbId(slug);
      // Nothing has claimed this slug yet — resolves to the base slug
      // unchanged, and no row was actually created (resolveCanonicalSlug
      // only computes a slug, it doesn't persist anything).
      expect(slug).toBe(baseSlug);
      expect(owner).toBeNull();
    });
  });

  describe("ensurePersonLinks", () => {
    it("dedupes seeds with an identical tmdbPersonId/role/character combination", async () => {
      const tmdbPersonId = randomTmdbPersonId();
      const seed = {
        tmdbPersonId,
        name: uniqueName("Dedup Person"),
        profilePath: null,
        knownForDepartment: "Acting",
        routeRole: "actor" as const,
        character: "The Hero",
      };

      const links = await PeopleCacheService.ensurePersonLinks([seed, seed, seed]);

      expect(links.length).toBe(1);
      expect(links[0]?.character).toBe("The Hero");
    });

    it("keeps distinct entries for the same person in different characters", async () => {
      const tmdbPersonId = randomTmdbPersonId();
      const name = uniqueName("Multi Character Person");
      const links = await PeopleCacheService.ensurePersonLinks([
        {
          tmdbPersonId,
          name,
          profilePath: null,
          knownForDepartment: "Acting",
          routeRole: "actor",
          character: "Role A",
        },
        {
          tmdbPersonId,
          name,
          profilePath: null,
          knownForDepartment: "Acting",
          routeRole: "actor",
          character: "Role B",
        },
      ]);

      expect(links.length).toBe(2);
    });

    it("returns an empty array for an empty seed list without touching the DB", async () => {
      const links = await PeopleCacheService.ensurePersonLinks([]);
      expect(links).toEqual([]);
    });
  });
});
