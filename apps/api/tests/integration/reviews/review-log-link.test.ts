import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestMovie, seedTestSerial } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

type MyReview = { id: string; content: string; diaryEntryId: string | null };

// A review written with a log points at it; deleting the log keeps the
// review but detaches it, and a review can only point at its author's own
// log of the same title (#87).
describe("reviews linked to logs", () => {
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
    return { status: response.status, body: (await response.json().catch(() => null)) as never };
  };

  const getMine = async (jar: CookieJar, mediaType: "movie" | "tv", tmdbId: number) =>
    (await send(jar, "GET", `/api/reviews/mine?mediaType=${mediaType}&tmdbId=${tmdbId}`))
      .body as MyReview[];

  const logMovie = async (jar: CookieJar, tmdbId: number, review?: string) => {
    const { status, body } = await send(jar, "POST", "/api/diary", {
      tmdbId,
      watchedDate: "2026-01-01",
      review,
    });
    expect(status).toBe(201);
    return (body as { entry: { id: string } }).entry.id;
  };

  const logSerial = async (jar: CookieJar, tmdbId: number, review?: string) => {
    const { status, body } = await send(jar, "POST", `/api/serials/${tmdbId}/log`, {
      watchedDate: "2026-01-01",
      review,
    });
    expect(status).toBe(201);
    return (body as { entry: { id: string } }).entry.id;
  };

  it("deleting a movie log keeps its review, detached", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "rllmov");
    const movie = await seedTestMovie();
    const entryId = await logMovie(jar, movie.tmdbId, "Kept after the log");
    expect((await getMine(jar, "movie", movie.tmdbId))[0]?.diaryEntryId).toBe(entryId);

    expect((await send(jar, "DELETE", `/api/diary/${entryId}`)).status).toBeLessThan(300);
    expect(await getMine(jar, "movie", movie.tmdbId)).toMatchObject([
      { content: "Kept after the log", diaryEntryId: null },
    ]);
  });

  it("deleting a series log keeps its review, detached", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "rllser");
    const serial = await seedTestSerial();
    const entryId = await logSerial(jar, serial.tmdbId, "Kept after the series log");
    expect((await getMine(jar, "tv", serial.tmdbId))[0]?.diaryEntryId).toBe(entryId);

    expect((await send(jar, "DELETE", `/api/serials/logs/${entryId}`)).status).toBeLessThan(300);
    expect(await getMine(jar, "tv", serial.tmdbId)).toMatchObject([
      { content: "Kept after the series log", diaryEntryId: null },
    ]);
  });

  it("attaches a review to the author's own series log", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "rllatt");
    const serial = await seedTestSerial();
    const entryId = await logSerial(jar, serial.tmdbId);

    const created = await send(jar, "POST", "/api/reviews", {
      mediaType: "tv",
      tmdbId: serial.tmdbId,
      content: "Added later",
      diaryEntryId: entryId,
    });
    expect(created.status).toBe(201);
    expect((await getMine(jar, "tv", serial.tmdbId))[0]?.diaryEntryId).toBe(entryId);
  });

  it("refuses a log that isn't the author's or isn't of that title", async () => {
    const owner = await signUpTestUser(getServer().baseUrl, "rllown");
    const other = await signUpTestUser(getServer().baseUrl, "rlloth");
    const movie = await seedTestMovie();
    const otherMovie = await seedTestMovie();
    const ownerEntryId = await logMovie(owner.jar, movie.tmdbId);
    const otherEntryId = await logMovie(other.jar, otherMovie.tmdbId);

    for (const [tmdbId, diaryEntryId] of [
      [movie.tmdbId, otherEntryId], // someone else's log
      [otherMovie.tmdbId, ownerEntryId], // own log, different title
      [movie.tmdbId, crypto.randomUUID()], // no such log
    ] as const) {
      const response = await send(owner.jar, "POST", "/api/reviews", {
        tmdbId,
        content: "Misattached",
        diaryEntryId,
      });
      expect(response.status).toBe(404);
    }
  });
});
