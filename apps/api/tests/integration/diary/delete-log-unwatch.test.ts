import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestMovie } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

// Deleting a log keeps the movie watched unless asked; asked, it is marked
// not watched only once no log of it is left (#86).
describe("deleting a movie log and its watched state", () => {
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

  const send = async (jar: CookieJar, method: string, path: string, body?: unknown) => {
    const response = await apiRequest(
      getServer().baseUrl,
      path,
      {
        method,
        headers: body === undefined ? {} : { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      jar,
    );
    expect(response.status).toBeLessThan(300);
    return (await response.json().catch(() => null)) as Record<string, unknown> | null;
  };

  const logMovie = async (jar: CookieJar, tmdbId: number) =>
    ((await send(jar, "POST", "/api/diary", { tmdbId, watchedDate: "2026-01-01" })) as {
      entry: { id: string };
    }).entry.id;

  const isWatched = async (jar: CookieJar, tmdbId: number) =>
    (await send(jar, "GET", `/api/interactions/${tmdbId}`))?.watched;

  it("keeps the movie watched by default", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "dlukeep");
    const movie = await seedTestMovie();
    const entryId = await logMovie(jar, movie.tmdbId);

    expect(await send(jar, "DELETE", `/api/diary/${entryId}`)).toEqual({
      success: true,
      unwatched: false,
    });
    expect(await isWatched(jar, movie.tmdbId)).toBe(true);
  });

  it("marks the movie not watched when its last log goes and that is asked", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "dlulast");
    const movie = await seedTestMovie();
    const entryId = await logMovie(jar, movie.tmdbId);

    expect(await send(jar, "DELETE", `/api/diary/${entryId}?unwatch=true`)).toEqual({
      success: true,
      unwatched: true,
    });
    expect(await isWatched(jar, movie.tmdbId)).toBe(false);
  });

  it("keeps the movie watched while another log of it remains", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "dlumore");
    const movie = await seedTestMovie();
    const firstId = await logMovie(jar, movie.tmdbId);
    await logMovie(jar, movie.tmdbId);

    expect(await send(jar, "DELETE", `/api/diary/${firstId}?unwatch=true`)).toEqual({
      success: true,
      unwatched: false,
    });
    expect(await isWatched(jar, movie.tmdbId)).toBe(true);
  });

  it("rejects an unreadable unwatch value", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "dlubad");
    const movie = await seedTestMovie();
    const entryId = await logMovie(jar, movie.tmdbId);

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/diary/${entryId}?unwatch=maybe`,
      { method: "DELETE" },
      jar,
    );
    expect(response.status).toBe(400);
  });
});
