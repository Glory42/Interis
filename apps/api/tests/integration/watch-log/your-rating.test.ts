import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { WATCH_LOG_MEDIA, watchLogClient } from "../../support/factories/watch-log.factory";

// Your Rating = the Interaction rating, else the latest rated Diary Entry. An
// in-sync rating follows the latest rated log as it changes, never wiped (#91).
describe.each(WATCH_LOG_MEDIA)("$label Your Rating", (media) => {
  let testServer: RunningTestServer | null = null;
  const baseUrl = () => {
    if (!testServer) throw new Error("Test server is not running");
    return testServer.baseUrl;
  };
  const client = watchLogClient(baseUrl, media);

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    await testServer?.close();
    testServer = null;
  });

  const rating = async (jar: CookieJar, tmdbId: number) =>
    (await client.interaction(jar, tmdbId)).rating;

  const detail = async (jar: CookieJar | undefined, tmdbId: number) =>
    (await client.send(jar, "GET", media.detailPath(tmdbId))) as {
      userRating: { rating: number | null; diaryEntryId: string | null } | null;
      ratingBreakdown: { totalRatedReviews: number; averageRating: number | null };
    };

  // Two rated logs, the later one in sync with the Interaction rating.
  const twoRatedLogs = async (prefix: string) => {
    const { jar } = await signUpTestUser(baseUrl(), prefix);
    const title = await media.seed();
    const olderId = await client.logId(jar, title.tmdbId, "2026-01-01", 6);
    const latestId = await client.logId(jar, title.tmdbId, "2026-03-01", 8);
    expect(await rating(jar, title.tmdbId)).toBe(8);
    return { jar, title, olderId, latestId };
  };

  it("logging with a rating replaces a direct rating", async () => {
    const { jar } = await signUpTestUser(baseUrl(), "yrnew");
    const title = await media.seed();
    await client.setInteraction(jar, title.tmdbId, { rating: 4 });

    await client.logId(jar, title.tmdbId, "2026-03-01", 8);
    expect(await rating(jar, title.tmdbId)).toBe(8);
  });

  it("logging without a rating, or an older watch, leaves it alone", async () => {
    const { jar } = await signUpTestUser(baseUrl(), "yrold");
    const title = await media.seed();
    await client.logId(jar, title.tmdbId, "2026-03-01", 8);

    await client.logId(jar, title.tmdbId, "2026-01-01", 6);
    await client.logId(jar, title.tmdbId, "2026-04-01");
    expect(await rating(jar, title.tmdbId)).toBe(8);
  });

  it("editing the latest log's rating follows; editing an older one doesn't", async () => {
    const { jar, title, olderId, latestId } = await twoRatedLogs("yredit");

    await client.send(jar, "PUT", media.logPath(olderId), { rating: 5 });
    expect(await rating(jar, title.tmdbId)).toBe(8);

    await client.send(jar, "PUT", media.logPath(latestId), { rating: 9 });
    expect(await rating(jar, title.tmdbId)).toBe(9);
  });

  it("moving an older log past the latest makes it the one followed", async () => {
    const { jar, title, olderId } = await twoRatedLogs("yrfwd");
    await client.send(jar, "PUT", media.logPath(olderId), { watchedDate: "2026-05-01" });
    expect(await rating(jar, title.tmdbId)).toBe(6);
  });

  it("backdating the latest log follows the log that is now latest", async () => {
    const { jar, title, latestId } = await twoRatedLogs("yrback");
    await client.send(jar, "PUT", media.logPath(latestId), { watchedDate: "2025-12-01" });
    expect(await rating(jar, title.tmdbId)).toBe(6);
  });

  it("clearing the latest log's rating follows the next rated log", async () => {
    const { jar, title, latestId } = await twoRatedLogs("yrclear");
    await client.send(jar, "PUT", media.logPath(latestId), { rating: null });
    expect(await rating(jar, title.tmdbId)).toBe(6);
  });

  it("deleting the latest rated log follows the next rated log", async () => {
    const { jar, title, latestId } = await twoRatedLogs("yrdel");
    await client.send(jar, "DELETE", media.logPath(latestId));
    expect(await rating(jar, title.tmdbId)).toBe(6);
  });

  it("keeps the rating when no rated log is left", async () => {
    const { jar } = await signUpTestUser(baseUrl(), "yrlast");
    const title = await media.seed();
    const entryId = await client.logId(jar, title.tmdbId, "2026-01-01", 8);

    await client.send(jar, "DELETE", media.logPath(entryId));
    expect(await rating(jar, title.tmdbId)).toBe(8);
  });

  it("never overwrites a rating set directly after the logs", async () => {
    const { jar, title, latestId } = await twoRatedLogs("yrdirect");
    await client.setInteraction(jar, title.tmdbId, { rating: 3 });

    await client.send(jar, "PUT", media.logPath(latestId), { watchedDate: "2025-12-01" });
    await client.send(jar, "DELETE", media.logPath(latestId));
    expect(await rating(jar, title.tmdbId)).toBe(3);
  });

  it("the detail page and title cards show the latest rated log, not the newest log", async () => {
    const { jar } = await signUpTestUser(baseUrl(), "yrdetail");
    const title = await media.seed();
    await client.logId(jar, title.tmdbId, "2026-01-01", 6);
    await client.setInteraction(jar, title.tmdbId, { rating: null });
    const newestId = await client.logId(jar, title.tmdbId, "2026-03-01");

    const body = await detail(jar, title.tmdbId);
    expect(body.userRating).toMatchObject({ diaryEntryId: newestId, rating: 6 });
    expect(body.ratingBreakdown).toMatchObject({ totalRatedReviews: 1, averageRating: 6 });

    const statuses = (await client.send(
      jar,
      "GET",
      `/api/viewer-status?items=${media.mediaType}:${title.tmdbId}`,
    )) as { items: Array<{ rating: number | null }> };
    expect(statuses.items).toMatchObject([{ rating: 6 }]);
  });

  it("the detail page shows a direct rating over the logs", async () => {
    const { jar } = await signUpTestUser(baseUrl(), "yrdetdir");
    const title = await media.seed();
    await client.logId(jar, title.tmdbId, "2026-01-01", 6);
    await client.setInteraction(jar, title.tmdbId, { rating: 2 });

    expect((await detail(jar, title.tmdbId)).userRating?.rating).toBe(2);
    expect((await detail(undefined, title.tmdbId)).userRating).toBeNull();
  });
});
