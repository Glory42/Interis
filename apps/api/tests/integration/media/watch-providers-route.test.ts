import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import { randomInt } from "node:crypto";
import * as RealBaseClient from "../../../src/infrastructure/tmdb/base-client";
import { apiRequest } from "../../support/app/http-client";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

const filmId = randomInt(1_000_000, 999_000_000);
const seriesId = filmId + 1;
const unknownFilmId = filmId + 2;
const tmdbCalls: string[] = [];
const realFetchTMDB = RealBaseClient.fetchTMDB;

const provider = (id: number, name: string, priority: number) => ({
  provider_id: id,
  provider_name: name,
  logo_path: `/logo-${id}.png`,
  display_priority: priority,
});

const filmProviders = {
  id: filmId,
  results: {
    US: {
      link: `https://www.themoviedb.org/movie/${filmId}/watch?locale=US`,
      flatrate: [provider(2, "Second Stream", 5), provider(1, "First Stream", 1)],
      rent: [provider(3, "Rent Shop", 2)],
      buy: [provider(3, "Rent Shop", 2)],
    },
    GB: {
      link: `https://www.themoviedb.org/movie/${filmId}/watch?locale=GB`,
      free: [provider(4, "Free Telly", 0)],
    },
    // A region with a link but no offers isn't worth offering in the picker.
    FR: { link: `https://www.themoviedb.org/movie/${filmId}/watch?locale=FR` },
  },
};

const seriesProviders = {
  id: seriesId,
  results: { DE: { link: "https://www.themoviedb.org/tv/x/watch?locale=DE", ads: [provider(5, "Ad Kanal", 3)] } },
};

void mock.module("../../../src/infrastructure/tmdb/base-client", () => ({
  ...RealBaseClient,
  fetchTMDB: (endpoint: string) => {
    if (endpoint === `/movie/${filmId}/watch/providers`) {
      tmdbCalls.push(endpoint);
      return Promise.resolve(filmProviders);
    }
    if (endpoint === `/tv/${seriesId}/watch/providers`) {
      tmdbCalls.push(endpoint);
      return Promise.resolve(seriesProviders);
    }
    if (endpoint === `/movie/${unknownFilmId}/watch/providers`) {
      tmdbCalls.push(endpoint);
      return Promise.reject(new Error("TMDB Error: 404 Not Found"));
    }
    return realFetchTMDB(endpoint);
  },
}));

type ProvidersBody = {
  region: string;
  link: string | null;
  flatrate: { providerId: number; name: string; logoPath: string | null; displayPriority: number }[];
  free: unknown[];
  ads: unknown[];
  rent: unknown[];
  buy: unknown[];
  availableRegions: string[];
};

describe("GET /api/{movies,serials}/:tmdbId/watch-providers", () => {
  let testServer: RunningTestServer | null = null;

  const get = async (path: string) => {
    if (!testServer) throw new Error("Test server is not running");
    return apiRequest(testServer.baseUrl, path);
  };

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    if (!testServer) return;
    await testServer.close();
    testServer = null;
  });

  it("returns US by default, providers ordered by display priority", async () => {
    const response = await get(`/api/movies/${filmId}/watch-providers`);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("public");
    const body = (await response.json()) as ProvidersBody;

    expect(body.region).toBe("US");
    expect(body.link).toBe(filmProviders.results.US.link);
    expect(body.flatrate.map((item) => item.name)).toEqual(["First Stream", "Second Stream"]);
    expect(body.flatrate[0]).toEqual({ providerId: 1, name: "First Stream", logoPath: "/logo-1.png", displayPriority: 1 });
    expect(body.rent).toHaveLength(1);
    expect(body.buy).toHaveLength(1);
    expect(body.free).toEqual([]);
    expect(body.availableRegions).toEqual(["GB", "US"]);
  });

  it("slices another region from the same cached TMDB response", async () => {
    const response = await get(`/api/movies/${filmId}/watch-providers?region=gb`);
    const body = (await response.json()) as ProvidersBody;

    expect(body.region).toBe("GB");
    expect(body.flatrate).toEqual([]);
    expect(body.free).toHaveLength(1);
    expect(tmdbCalls.filter((call) => call.startsWith("/movie/"))).toEqual([`/movie/${filmId}/watch/providers`]);
  });

  it("returns empty groups for a region without data", async () => {
    const response = await get(`/api/movies/${filmId}/watch-providers?region=JP`);
    const body = (await response.json()) as ProvidersBody;

    expect(response.status).toBe(200);
    expect(body).toMatchObject({ region: "JP", link: null, flatrate: [], free: [], ads: [], rent: [], buy: [] });
  });

  it("treats a title TMDB doesn't know as having no providers", async () => {
    const response = await get(`/api/movies/${unknownFilmId}/watch-providers`);
    const body = (await response.json()) as ProvidersBody;

    expect(response.status).toBe(200);
    expect(body.availableRegions).toEqual([]);
    expect(body.flatrate).toEqual([]);
  });

  it("serves Series from the tv endpoint", async () => {
    const response = await get(`/api/serials/${seriesId}/watch-providers?region=DE`);
    const body = (await response.json()) as ProvidersBody;

    expect(response.status).toBe(200);
    expect(body.ads).toHaveLength(1);
    expect(body.availableRegions).toEqual(["DE"]);
  });

  it.each(["USA", "1A", "u", "", "U$"])("rejects region %p with 400", async (region) => {
    const response = await get(`/api/movies/${filmId}/watch-providers?region=${encodeURIComponent(region)}`);
    expect(response.status).toBe(400);
  });

  it("rejects an invalid tmdb id with 400", async () => {
    const response = await get("/api/serials/abc/watch-providers");
    expect(response.status).toBe(400);
  });
});
