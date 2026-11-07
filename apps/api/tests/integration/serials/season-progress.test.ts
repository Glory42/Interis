import { afterAll, beforeAll, describe, expect, it, mock } from "bun:test";
import * as RealBaseClient from "../../../src/infrastructure/tmdb/base-client";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestSerial } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

let fakeSeriesTmdbId = -1;
const realFetchTMDB = RealBaseClient.fetchTMDB;

const seriesDetailFixture = () => ({
  id: fakeSeriesTmdbId,
  name: "Progress Serial",
  poster_path: null,
  backdrop_path: null,
  number_of_seasons: 2,
  number_of_episodes: 14,
  seasons: [
    { id: 3, name: "Specials", season_number: 0, episode_count: 3, air_date: null, poster_path: null },
    { id: 1, name: "Season 1", season_number: 1, episode_count: 8, air_date: null, poster_path: null },
    { id: 2, name: "Season 2", season_number: 2, episode_count: 6, air_date: null, poster_path: null },
  ],
});

// Only this test's series is faked: its detail resolves, its other TMDB calls fail.
void mock.module("../../../src/infrastructure/tmdb/base-client", () => ({
  ...RealBaseClient,
  fetchTMDB: (endpoint: string) => {
    const prefix = `/tv/${fakeSeriesTmdbId}`;
    if (!endpoint.startsWith(prefix)) return realFetchTMDB(endpoint);
    if (endpoint.startsWith(`${prefix}?`)) return Promise.resolve(seriesDetailFixture());
    return Promise.reject(new Error("TMDB Error: 404 Not Found"));
  },
}));

type ViewerStatus = { episodes: { watched: number } | null };
type SeriesDetail = {
  series: {
    seasons: {
      seasonNumber: number;
      episodeCount: number | null;
      viewerInteraction: { watchedEpisodeCount: number } | null;
    }[];
  };
};

describe("season progress", () => {
  let testServer: RunningTestServer | null = null;
  let jar: CookieJar;
  let tmdbId: number;

  const getServer = (): RunningTestServer => {
    if (!testServer) throw new Error("Test server is not running");
    return testServer;
  };

  beforeAll(async () => {
    testServer = await startTestServer();
    ({ jar } = await signUpTestUser(getServer().baseUrl, "sprogress"));
    ({ tmdbId } = await seedTestSerial("Progress Serial"));
    fakeSeriesTmdbId = tmdbId;
  });

  afterAll(async () => {
    if (!testServer) return;
    await testServer.close();
    testServer = null;
  });

  const markThrough = (seasonNumber: number, episodeNumber: number, cookieJar?: CookieJar) =>
    apiRequest(
      getServer().baseUrl,
      `/api/serials/${tmdbId}/seasons/${seasonNumber}/watched-through/${episodeNumber}`,
      { method: "POST" },
      cookieJar,
    );

  it("marks every episode up to the chosen one watched, keeping later ones", async () => {
    const episodeSix = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${tmdbId}/seasons/1/episodes/6/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watched: true }),
      },
      jar,
    );
    expect(episodeSix.ok).toBe(true);

    const response = await markThrough(1, 4, jar);
    expect(response.status).toBe(200);

    const statusResponse = await apiRequest(
      getServer().baseUrl,
      `/api/viewer-status?items=tv:${tmdbId}`,
      {},
      jar,
    );
    const { items } = (await statusResponse.json()) as { items: ViewerStatus[] };
    expect(items[0]!.episodes?.watched).toBe(5);
  });

  it("shows watched out of total episodes for each season on the detail", async () => {
    const response = await apiRequest(getServer().baseUrl, `/api/serials/${tmdbId}/detail`, {}, jar);
    expect(response.status).toBe(200);
    const detail = (await response.json()) as SeriesDetail;

    const bySeason = new Map(detail.series.seasons.map((season) => [season.seasonNumber, season]));
    expect(bySeason.get(1)).toMatchObject({ episodeCount: 8, viewerInteraction: { watchedEpisodeCount: 5 } });
    expect(bySeason.get(2)).toMatchObject({ episodeCount: 6, viewerInteraction: { watchedEpisodeCount: 0 } });
  });

  it("counts watched specials on their own season, not in the series total", async () => {
    expect((await markThrough(0, 2, jar)).status).toBe(200);

    const response = await apiRequest(getServer().baseUrl, `/api/serials/${tmdbId}/detail`, {}, jar);
    const detail = (await response.json()) as SeriesDetail & { viewerTracking: { watchedEpisodesCount: number } };

    const specials = detail.series.seasons.find((season) => season.seasonNumber === 0);
    expect(specials).toMatchObject({ episodeCount: 3, viewerInteraction: { watchedEpisodeCount: 2 } });
    expect(detail.viewerTracking.watchedEpisodesCount).toBe(5);
  });

  it("needs sign-in and a real episode number", async () => {
    expect((await markThrough(1, 4)).status).toBe(401);
    expect((await markThrough(1, 0, jar)).status).toBe(400);
  });
});
