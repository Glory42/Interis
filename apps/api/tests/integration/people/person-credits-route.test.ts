import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { randomInt } from "node:crypto";
import * as RealBaseClient from "../../../src/infrastructure/tmdb/base-client";
import { apiRequest } from "../../support/app/http-client";
import { PeopleCacheService } from "../../../src/modules/people/services/people-cache.service";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

const tmdbPersonId = randomInt(1_000_000, 999_000_000);
const personPathPrefix = `/person/${tmdbPersonId}`;
const tmdbPersonCalls: string[] = [];
const realFetchTMDB = RealBaseClient.fetchTMDB;

const crewCredit = (id: number, job: string, department: string, releaseDate: string) => ({
  id,
  media_type: "movie",
  title: `Film ${id}`,
  poster_path: null,
  backdrop_path: null,
  release_date: releaseDate,
  job,
  department,
});

// 45 distinct crew titles; title 1 is listed twice (directed and wrote it).
const combinedCredits = {
  cast: [
    { id: 900, media_type: "tv", name: "Show 900", poster_path: null, backdrop_path: null, character: "Host" },
  ],
  crew: [
    crewCredit(1, "Director", "Directing", "2024-05-01"),
    crewCredit(1, "Writer", "Writing", "2024-05-01"),
    ...Array.from({ length: 44 }, (_, index) =>
      crewCredit(index + 2, "Director", "Directing", `20${10 + (index % 10)}-01-01`),
    ),
  ],
};

const personFixture = (endpoint: string): unknown => {
  if (endpoint.includes("/combined_credits")) return combinedCredits;
  if (endpoint.includes("/external_ids")) return {};
  if (endpoint.includes("/images")) return { profiles: [] };
  return { id: tmdbPersonId, name: "Credits Person", profile_path: null, known_for_department: "Directing" };
};

// Only this test's person id is faked; every other TMDB call goes to the real client.
void mock.module("../../../src/infrastructure/tmdb/base-client", () => ({
  ...RealBaseClient,
  fetchTMDB: (endpoint: string) => {
    if (!endpoint.startsWith(personPathPrefix)) return realFetchTMDB(endpoint);
    tmdbPersonCalls.push(endpoint);
    return Promise.resolve(personFixture(endpoint));
  },
}));

type CreditsPage = {
  items: { tmdbId: number; jobs: string[] }[];
  total: number;
};

describe("GET /api/people/:role/:slug/credits", () => {
  let testServer: RunningTestServer | null = null;
  let slug = "";

  const getServer = (): RunningTestServer => {
    if (!testServer) throw new Error("Test server is not running");
    return testServer;
  };

  beforeAll(async () => {
    testServer = await startTestServer();
    const cached = await PeopleCacheService.upsertPersonCache({
      tmdbPersonId,
      name: `Credits Person ${tmdbPersonId}`,
      knownForDepartment: "Directing",
      routeRoleHints: ["director"],
      profilePath: null,
      popularity: 1,
    });
    slug = cached!.slug;
  });

  afterAll(async () => {
    if (!testServer) return;
    await testServer.close();
    testServer = null;
  });

  it("lists each crew title once with all its jobs, and a total matching TMDB", async () => {
    const response = await apiRequest(
      getServer().baseUrl,
      `/api/people/director/${slug}/credits?media=combined&type=crew&limit=40&offset=0`,
    );
    expect(response.status).toBe(200);
    const page = (await response.json()) as CreditsPage;

    expect(page.total).toBe(45);
    expect(page.items).toHaveLength(40);
    const ids = page.items.map((item) => item.tmdbId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(page.items.find((item) => item.tmdbId === 1)?.jobs).toEqual(["Director", "Writer"]);
  });

  it("returns the second page from the same cached TMDB credits", async () => {
    const response = await apiRequest(
      getServer().baseUrl,
      `/api/people/director/${slug}/credits?media=movies&type=crew&limit=40&offset=40`,
    );
    const page = (await response.json()) as CreditsPage;

    expect(page.total).toBe(45);
    expect(page.items).toHaveLength(5);
    expect(response.headers.get("cache-control")).toBe("public, max-age=300");
    expect(tmdbPersonCalls.filter((call) => call.includes("/combined_credits"))).toHaveLength(1);
  });

  it("filters crew credits by job", async () => {
    const response = await apiRequest(
      getServer().baseUrl,
      `/api/people/director/${slug}/credits?type=crew&job=Writer`,
    );
    const page = (await response.json()) as CreditsPage;

    expect(page.items.map((item) => item.tmdbId)).toEqual([1]);
    expect(page.total).toBe(1);
  });

  it("returns credit counts and job counts on the person detail", async () => {
    const response = await apiRequest(getServer().baseUrl, `/api/people/director/${slug}`);
    expect(response.status).toBe(200);
    const detail = (await response.json()) as {
      credits: { counts: unknown; jobCounts: unknown };
    };

    expect(detail.credits.counts).toEqual({
      combined: { cast: 1, crew: 45 },
      movies: { cast: 0, crew: 45 },
      tv: { cast: 1, crew: 0 },
    });
    expect(detail.credits.jobCounts).toEqual([
      { job: "Director", count: 45 },
      { job: "Writer", count: 1 },
    ]);
    expect(response.headers.get("cache-control")).toBe("public, max-age=300");
    expect(tmdbPersonCalls.filter((call) => call.includes("/combined_credits"))).toHaveLength(1);
  });
});
