import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestMovie, seedTestSerial } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

// "Your rating" follows the latest rated log: logging or editing the latest
// log with a rating sets it, an older watch doesn't (#91).
describe("log rating and the star rating", () => {
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

  const logMovie = async (jar: CookieJar, tmdbId: number, watchedDate: string, rating?: number) =>
    ((await send(jar, "POST", "/api/diary", { tmdbId, watchedDate, rating })) as {
      entry: { id: string };
    }).entry.id;

  const movieRating = async (jar: CookieJar, tmdbId: number) =>
    (await send(jar, "GET", `/api/interactions/${tmdbId}`))?.rating;

  const rateMovie = (jar: CookieJar, tmdbId: number, rating: number) =>
    send(jar, "PUT", `/api/interactions/${tmdbId}`, { rating });

  it("logging with a rating replaces the star rating", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "lrsnew");
    const movie = await seedTestMovie();
    await rateMovie(jar, movie.tmdbId, 4);

    await logMovie(jar, movie.tmdbId, "2026-03-01", 8);
    expect(await movieRating(jar, movie.tmdbId)).toBe(8);
  });

  it("logging an older watch keeps the latest log's rating", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "lrsold");
    const movie = await seedTestMovie();
    await logMovie(jar, movie.tmdbId, "2026-03-01", 8);

    await logMovie(jar, movie.tmdbId, "2026-01-01", 6);
    expect(await movieRating(jar, movie.tmdbId)).toBe(8);
  });

  it("editing the latest log's rating updates the star rating", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "lrsedit");
    const movie = await seedTestMovie();
    const olderId = await logMovie(jar, movie.tmdbId, "2026-01-01", 6);
    const latestId = await logMovie(jar, movie.tmdbId, "2026-03-01", 8);

    await send(jar, "PUT", `/api/diary/${olderId}`, { rating: 5 });
    expect(await movieRating(jar, movie.tmdbId)).toBe(8);

    await send(jar, "PUT", `/api/diary/${latestId}`, { rating: 9 });
    expect(await movieRating(jar, movie.tmdbId)).toBe(9);
  });

  it("logging without a rating leaves the star rating alone", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "lrsnone");
    const movie = await seedTestMovie();
    await rateMovie(jar, movie.tmdbId, 4);

    await logMovie(jar, movie.tmdbId, "2026-03-01");
    expect(await movieRating(jar, movie.tmdbId)).toBe(4);
  });

  it("does the same for series logs", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "lrsser");
    const serial = await seedTestSerial();
    const seriesRating = async () =>
      (await send(jar, "GET", `/api/serials/${serial.tmdbId}/interaction`))?.rating;
    await send(jar, "PUT", `/api/serials/${serial.tmdbId}/interaction`, { rating: 4 });

    const logged = (await send(jar, "POST", `/api/serials/${serial.tmdbId}/log`, {
      watchedDate: "2026-03-01",
      rating: 8,
    })) as { entry: { id: string } };
    expect(await seriesRating()).toBe(8);

    await send(jar, "POST", `/api/serials/${serial.tmdbId}/log`, {
      watchedDate: "2026-01-01",
      rating: 6,
    });
    expect(await seriesRating()).toBe(8);

    await send(jar, "PUT", `/api/serials/logs/${logged.entry.id}`, { rating: 9 });
    expect(await seriesRating()).toBe(9);
  });
});
