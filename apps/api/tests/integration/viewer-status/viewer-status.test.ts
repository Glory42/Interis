import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../../src/infrastructure/database/db";
import { tvSeries } from "../../../src/modules/tv/tv.entity";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestFilm, seedTestSeries } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

type ViewerStatus = {
  mediaType: "movie" | "tv";
  tmdbId: number;
  watched: boolean;
  rating: number | null;
  liked: boolean;
  watchlisted: boolean;
  episodes: { watched: number; total: number | null } | null;
};

describe("GET /api/viewer-status", () => {
  let testServer: RunningTestServer | null = null;

  const getServer = (): RunningTestServer => {
    if (!testServer) throw new Error("Test server is not running");
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

  const put = async (jar: CookieJar, path: string, body: unknown) => {
    const response = await apiRequest(
      getServer().baseUrl,
      path,
      { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
      jar,
    );
    expect(response.ok).toBe(true);
  };

  const getStatuses = async (items: string, jar?: CookieJar) => {
    const response = await apiRequest(
      getServer().baseUrl,
      `/api/viewer-status?items=${items}`,
      {},
      jar,
    );
    expect(response.status).toBe(200);
    return ((await response.json()) as { items: ViewerStatus[] }).items;
  };

  it("returns the signed-in viewer's marks for each requested title, in order", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "vstatus");
    const rated = await seedTestFilm("Status Rated Movie");
    const queued = await seedTestFilm("Status Queued Movie");
    const serial = await seedTestSeries("Status Serial");
    await db.update(tvSeries).set({ numberOfEpisodes: 10 }).where(eq(tvSeries.id, serial.id));

    await put(jar, `/api/interactions/${rated.tmdbId}`, { liked: true, rating: 8 });
    await put(jar, `/api/interactions/${queued.tmdbId}`, { watchlisted: true });
    for (const episode of [1, 2, 3]) {
      await put(jar, `/api/serials/${serial.tmdbId}/seasons/1/episodes/${episode}/interaction`, {
        watched: true,
      });
    }

    const statuses = await getStatuses(
      `movie:${rated.tmdbId},tv:${serial.tmdbId},movie:${queued.tmdbId},movie:999999999`,
      jar,
    );

    expect(statuses).toEqual([
      { mediaType: "movie", tmdbId: rated.tmdbId, watched: true, rating: 8, liked: true, watchlisted: false, episodes: null },
      { mediaType: "tv", tmdbId: serial.tmdbId, watched: false, rating: null, liked: false, watchlisted: false, episodes: { watched: 3, total: 10 } },
      { mediaType: "movie", tmdbId: queued.tmdbId, watched: false, rating: null, liked: false, watchlisted: true, episodes: null },
      { mediaType: "movie", tmdbId: 999999999, watched: false, rating: null, liked: false, watchlisted: false, episodes: null },
    ]);
  });

  it("gives signed-out visitors empty marks", async () => {
    const movie = await seedTestFilm("Status Anonymous Movie");
    const statuses = await getStatuses(`movie:${movie.tmdbId}`);

    expect(statuses).toEqual([
      { mediaType: "movie", tmdbId: movie.tmdbId, watched: false, rating: null, liked: false, watchlisted: false, episodes: null },
    ]);
  });

  it("rejects malformed items and more than 60", async () => {
    const bad = await apiRequest(getServer().baseUrl, "/api/viewer-status?items=film:1");
    expect(bad.status).toBe(400);

    const tooMany = Array.from({ length: 61 }, (_, index) => `movie:${index + 1}`).join(",");
    const overLimit = await apiRequest(getServer().baseUrl, `/api/viewer-status?items=${tooMany}`);
    expect(overLimit.status).toBe(400);
  });
});
