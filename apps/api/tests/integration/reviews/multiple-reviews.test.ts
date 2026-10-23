import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestMovie, seedTestSerial } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

type MyReview = {
  id: string;
  content: string;
  diaryEntryId: string | null;
  rating: number | null;
  watchedDate: string | null;
};

// #72: a user can review one title more than once, each log keeps the
// review written with it (#73), and /api/reviews/mine lists them.
describe("multiple reviews per title", () => {
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

  const post = async (jar: CookieJar, path: string, body: unknown) => {
    const response = await apiRequest(
      getServer().baseUrl,
      path,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
      jar,
    );
    return { status: response.status, body: (await response.json()) as Record<string, unknown> };
  };

  const getMine = async (jar: CookieJar, query: string) => {
    const response = await apiRequest(
      getServer().baseUrl,
      `/api/reviews/mine?${query}`,
      {},
      jar,
    );
    return { status: response.status, body: (await response.json()) as MyReview[] };
  };

  const logMovie = async (jar: CookieJar, tmdbId: number, watchedDate: string, review: string) => {
    const { status, body } = await post(jar, "/api/diary", {
      tmdbId,
      watchedDate,
      rating: watchedDate === "2026-01-01" ? 6 : 9,
      review,
    });
    expect(status).toBe(201);
    return body as { entry: { id: string }; review: { id: string } };
  };

  it("each log of a rewatched movie keeps its own review", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "mrlogs");
    const movie = await seedTestMovie("Rewatched Movie");
    const first = await logMovie(jar, movie.tmdbId, "2026-01-01", "Didn't get it");
    const second = await logMovie(jar, movie.tmdbId, "2026-03-01", "Now I get it");
    expect(second.review.id).not.toBe(first.review.id);

    const diary = (await (
      await apiRequest(getServer().baseUrl, "/api/diary", {}, jar)
    ).json()) as Array<{ id: string; reviewContent: string | null }>;
    const logs = diary.filter((entry) => [first.entry.id, second.entry.id].includes(entry.id));
    expect(logs).toHaveLength(2);
    expect(logs.find((entry) => entry.id === first.entry.id)?.reviewContent).toBe(
      "Didn't get it",
    );
    expect(logs.find((entry) => entry.id === second.entry.id)?.reviewContent).toBe(
      "Now I get it",
    );

    const publicLogs = (await (
      await apiRequest(getServer().baseUrl, `/api/movies/${movie.tmdbId}/logs`)
    ).json()) as Array<{ diaryEntryId: string; reviewContent: string | null }>;
    expect(
      publicLogs.map((log) => [log.diaryEntryId, log.reviewContent]).sort(),
    ).toEqual(
      [
        [first.entry.id, "Didn't get it"],
        [second.entry.id, "Now I get it"],
      ].sort(),
    );

    const mine = await getMine(jar, `mediaType=movie&tmdbId=${movie.tmdbId}`);
    expect(mine.status).toBe(200);
    expect(
      mine.body.map((review) => [
        review.content,
        review.diaryEntryId,
        review.rating,
        review.watchedDate,
      ]),
    ).toEqual([
      ["Now I get it", second.entry.id, 9, "2026-03-01"],
      ["Didn't get it", first.entry.id, 6, "2026-01-01"],
    ]);
  });

  it("a log holds at most one review", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "mrlogone");
    const movie = await seedTestMovie("One Review Per Log");
    const logged = await logMovie(jar, movie.tmdbId, "2026-01-01", "Written with the log");

    const extra = await post(jar, "/api/reviews", {
      tmdbId: movie.tmdbId,
      content: "Second review on the same log",
      diaryEntryId: logged.entry.id,
    });
    expect(extra.status).toBe(409);
  });

  it("logging a series twice with reviews keeps both", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "mrseries");
    const serial = await seedTestSerial("Rewatched Serial");
    for (const [watchedDate, review] of [
      ["2026-01-01", "First run"],
      ["2026-02-01", "Second run"],
    ]) {
      expect(
        (await post(jar, `/api/serials/${serial.tmdbId}/log`, { watchedDate, review })).status,
      ).toBe(201);
    }

    const mine = await getMine(jar, `mediaType=tv&tmdbId=${serial.tmdbId}`);
    expect(mine.body.map((review) => review.content)).toEqual(["Second run", "First run"]);
  });

  it("the season review endpoint edits the newest season review", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "mrseason");
    const serial = await seedTestSerial("Season Review Serial");
    const path = `/api/serials/${serial.tmdbId}/seasons/1/review`;

    expect((await post(jar, path, { content: "Draft" })).status).toBeLessThan(300);
    expect((await post(jar, path, { content: "Final" })).status).toBeLessThan(300);

    const mine = await getMine(jar, `mediaType=tv_season&tmdbId=${serial.tmdbId}&seasonNumber=1`);
    expect(mine.body.map((review) => review.content)).toEqual(["Final"]);
  });

  it("the season review endpoint writes another review or edits a chosen one", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "mrseasonpick");
    const other = await signUpTestUser(getServer().baseUrl, "mrseasonother");
    const serial = await seedTestSerial("Season Picker Serial");
    const path = `/api/serials/${serial.tmdbId}/seasons/1/review`;
    const seasonQuery = `mediaType=tv_season&tmdbId=${serial.tmdbId}&seasonNumber=1`;

    await post(jar, path, { content: "First take" });
    expect((await post(jar, path, { content: "Second take", createNew: true })).status).toBe(200);
    const [newest, oldest] = (await getMine(jar, seasonQuery)).body;
    expect([newest?.content, oldest?.content]).toEqual(["Second take", "First take"]);

    expect(
      (await post(jar, path, { content: "First take, revised", reviewId: oldest!.id })).status,
    ).toBe(200);
    expect((await getMine(jar, seasonQuery)).body.map((review) => review.content)).toEqual([
      "Second take",
      "First take, revised",
    ]);

    // Someone else's review, or one of another season, can't be targeted.
    expect((await post(other.jar, path, { content: "Hijack", reviewId: oldest!.id })).status).toBe(
      404,
    );
    expect(
      (
        await post(jar, `/api/serials/${serial.tmdbId}/seasons/2/review`, {
          content: "Wrong season",
          reviewId: oldest!.id,
        })
      ).status,
    ).toBe(404);
    expect(
      (await post(jar, path, { content: "Both", reviewId: oldest!.id, createNew: true })).status,
    ).toBe(400);

    const deleted = await apiRequest(
      getServer().baseUrl,
      `${path}?reviewId=${oldest!.id}`,
      { method: "DELETE" },
      jar,
    );
    expect(deleted.status).toBe(200);
    expect((await getMine(jar, seasonQuery)).body.map((review) => review.content)).toEqual([
      "Second take",
    ]);
  });

  it("only lists the viewer's own reviews, and checks the query", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "mrauthor");
    const viewer = await signUpTestUser(getServer().baseUrl, "mrviewer");
    const movie = await seedTestMovie("Someone Else's Review");
    await post(author.jar, "/api/reviews", { tmdbId: movie.tmdbId, content: "Mine" });

    expect((await getMine(viewer.jar, `mediaType=movie&tmdbId=${movie.tmdbId}`)).body).toEqual([]);
    expect((await getMine(viewer.jar, `mediaType=tv_season&tmdbId=${movie.tmdbId}`)).status).toBe(
      400,
    );
    const anonymous = await apiRequest(
      getServer().baseUrl,
      `/api/reviews/mine?mediaType=movie&tmdbId=${movie.tmdbId}`,
    );
    expect(anonymous.status).toBe(401);
  });
});
