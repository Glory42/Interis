import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestSerial } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

// None of these tests mark a whole season watched, the one update that needs
// TMDB's episode list and fails with 503 without it (#69; see
// season-cascade-tmdb.test.ts). An episode toggle's season sync tolerates the
// fake seeded tmdbId, so the season/episode row's own watched/liked/rating
// state (what these tests assert on) is persisted and returned regardless.
describe("season and episode interaction", () => {
  let testServer: RunningTestServer | null = null;

  const getServer = (): RunningTestServer => {
    if (!testServer) {
      throw new Error("Test server is not running");
    }
    return testServer;
  };

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    if (!testServer) return;
    await testServer.close();
    testServer = null;
  });

  it("requires auth for season and episode interaction updates", async () => {
    const serial = await seedTestSerial();

    const seasonResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ liked: true }),
      },
    );
    expect(seasonResponse.status).toBe(401);

    const episodeResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/episodes/1/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ liked: true }),
      },
    );
    expect(episodeResponse.status).toBe(401);
  }, 15000);

  it("persists season-level watched/liked/rating", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "seaint");
    const serial = await seedTestSerial();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ liked: true, rating: 9 }),
      },
      jar,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      watched: boolean;
      liked: boolean;
      rating: number;
    };
    expect(body.liked).toBe(true);
    expect(body.rating).toBe(9);
    // Liking / rating a season doesn't mark it (or its episodes) watched (#66).
    expect(body.watched).toBe(false);
  }, 15000);

  it("persists episode-level watched/liked/rating", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "epint");
    const serial = await seedTestSerial();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/episodes/1/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watched: true, liked: true }),
      },
      jar,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { watched: boolean; liked: boolean };
    expect(body.watched).toBe(true);
    expect(body.liked).toBe(true);
  }, 15000);

  it("rejects an invalid episode number", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "epbad");
    const serial = await seedTestSerial();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/episodes/0/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watched: true }),
      },
      jar,
    );
    expect(response.status).toBe(400);
  });
});
