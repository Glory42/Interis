import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { createCookieJar, type CookieJar } from "../../support/app/cookie-jar";
import { seedTestFilm, seedTestSeries } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

type MyReview = { id: string; content: string; diaryEntryId: string | null };
type ReviewDetail = { log: { id: string; watchedDate: string; rating: number | null; rewatch: boolean } | null };

// A review can only point at its author's own log of the same title (#87).
// Detaching on log delete is covered in watch-log/.
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

  it("attaches a review to the author's own series log", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "rllatt");
    const serial = await seedTestSeries();
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

  const getDetail = async (username: string, reviewId: string) =>
    (await send(createCookieJar(), "GET", `/api/users/${username}/reviews/${reviewId}`)).body as ReviewDetail;

  it("returns a review's log with its detail, so the author can edit both", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "rlldet");
    const movie = await seedTestFilm();
    const serial = await seedTestSeries();
    const movieEntryId = await logMovie(jar, movie.tmdbId, "Logged with a review");
    const serialEntryId = await logSerial(jar, serial.tmdbId, "Series log review");
    const standalone = await send(jar, "POST", "/api/reviews", { tmdbId: movie.tmdbId, content: "On its own" });
    const [movieReview] = (await getMine(jar, "movie", movie.tmdbId)).filter((review) => review.diaryEntryId);
    const [serialReview] = await getMine(jar, "tv", serial.tmdbId);

    const movieDetail = await getDetail(username, movieReview!.id);
    expect(movieDetail.log).toEqual({ id: movieEntryId, watchedDate: "2026-01-01", rating: null, rewatch: false });

    // A series review reads its series log, not a movie log.
    const serialDetail = await getDetail(username, serialReview!.id);
    expect(serialDetail.log?.id).toBe(serialEntryId);

    const standaloneId = (standalone.body as { review: { id: string } }).review.id;
    expect((await getDetail(username, standaloneId)).log).toBeNull();
  });

  it("refuses a log that isn't the author's or isn't of that title", async () => {
    const owner = await signUpTestUser(getServer().baseUrl, "rllown");
    const other = await signUpTestUser(getServer().baseUrl, "rlloth");
    const movie = await seedTestFilm();
    const otherMovie = await seedTestFilm();
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
