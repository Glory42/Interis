import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestFilm, seedTestSeries } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

type ShelfPage = {
  items: { tmdbId: number; mediaType: "movie" | "tv" }[];
  total: number;
  counts: { movie: number; tv: number };
};

describe("profile likes and watchlist shelves", () => {
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

  const getShelf = async (path: string): Promise<ShelfPage> => {
    const response = await apiRequest(getServer().baseUrl, path);
    expect(response.status).toBe(200);
    return (await response.json()) as ShelfPage;
  };

  it("filters likes by type on the server and returns real totals", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "shelflike");
    const firstMovie = await seedTestFilm("Shelf Movie A");
    const secondMovie = await seedTestFilm("Shelf Movie B");
    const serial = await seedTestSeries("Shelf Serial");

    await put(jar, `/api/interactions/${firstMovie.tmdbId}`, { liked: true });
    await put(jar, `/api/interactions/${secondMovie.tmdbId}`, { liked: true });
    await put(jar, `/api/serials/${serial.tmdbId}/interaction`, { liked: true });

    const firstPage = await getShelf(`/api/users/${username}/likes?limit=1`);
    expect(firstPage.items).toHaveLength(1);
    expect(firstPage.total).toBe(3);
    expect(firstPage.counts).toEqual({ movie: 2, tv: 1 });

    const tvOnly = await getShelf(`/api/users/${username}/likes?type=tv`);
    expect(tvOnly.items.map((item) => item.tmdbId)).toEqual([serial.tmdbId]);
    expect(tvOnly.total).toBe(1);

    const oldestFirst = await getShelf(`/api/users/${username}/likes?type=movie&sort=oldest`);
    expect(oldestFirst.items.map((item) => item.tmdbId)).toEqual([
      firstMovie.tmdbId,
      secondMovie.tmdbId,
    ]);
    expect(oldestFirst.total).toBe(2);
  });

  it("returns the watchlist total separately from likes", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "shelfwatch");
    const movie = await seedTestFilm("Shelf Watchlist Movie");
    await put(jar, `/api/interactions/${movie.tmdbId}`, { watchlisted: true });

    const watchlist = await getShelf(`/api/users/${username}/watchlist`);
    expect(watchlist.items.map((item) => item.tmdbId)).toEqual([movie.tmdbId]);
    expect(watchlist.total).toBe(1);
    expect(watchlist.counts).toEqual({ movie: 1, tv: 0 });
  });
});
