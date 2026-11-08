import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { WATCH_LOG_MEDIA, watchLogClient } from "../../support/factories/watch-log.factory";

type LogReview = { id: string; content: string; containsSpoilers: boolean } | null;

// One log edit request also creates, edits or deletes the Review attached
// to the log.
describe.each(WATCH_LOG_MEDIA)("$label log edit with its Review", (media) => {
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

  const edit = async (jar: CookieJar, entryId: string, body: Record<string, unknown>) =>
    (await client.send(jar, "PUT", media.logPath(entryId), body)) as {
      id: string;
      rating: number | null;
      review: LogReview;
    };

  const myReviews = async (jar: CookieJar, tmdbId: number) =>
    (await client.send(
      jar,
      "GET",
      `/api/reviews/mine?mediaType=${media.mediaType}&tmdbId=${tmdbId}`,
    )) as unknown as Array<{ id: string; content: string; diaryEntryId: string | null }>;

  it("creates an attached review with the log edit", async () => {
    const { jar } = await signUpTestUser(baseUrl(), "lrecr");
    const title = await media.seed();
    const entryId = await client.logId(jar, title.tmdbId, "2026-01-01");

    const updated = await edit(jar, entryId, { rating: 7, review: " New take ", containsSpoilers: true });

    expect(updated.rating).toBe(7);
    expect(updated.review).toMatchObject({ content: "New take", containsSpoilers: true });
    expect(await myReviews(jar, title.tmdbId)).toMatchObject([
      { id: updated.review!.id, content: "New take", diaryEntryId: entryId },
    ]);
  });

  it("edits the attached review in the same request", async () => {
    const { jar } = await signUpTestUser(baseUrl(), "lreed");
    const title = await media.seed();
    const created = await client.log(jar, title.tmdbId, {
      watchedDate: "2026-01-01",
      review: "First draft",
    });

    const updated = await edit(jar, created.entry.id, {
      watchedDate: "2026-01-05",
      review: "Second draft",
      containsSpoilers: true,
    });

    expect(updated.review).toEqual({
      id: created.review!.id,
      content: "Second draft",
      containsSpoilers: true,
    });
    expect(await myReviews(jar, title.tmdbId)).toHaveLength(1);
  });

  it("changes only the spoiler flag when no text is sent", async () => {
    const { jar } = await signUpTestUser(baseUrl(), "lresp");
    const title = await media.seed();
    const created = await client.log(jar, title.tmdbId, { watchedDate: "2026-01-01", review: "Text" });

    const updated = await edit(jar, created.entry.id, { containsSpoilers: true });
    expect(updated.review).toMatchObject({ content: "Text", containsSpoilers: true });
    expect(updated).toMatchObject({ id: created.entry.id, [media.mediaIdKey]: title.id });
    expect(updated).not.toHaveProperty("tmdbId");
  });

  it.each([null, "", "   "])("deletes the attached review when it is sent as %p", async (review) => {
    const { jar } = await signUpTestUser(baseUrl(), "lredel");
    const title = await media.seed();
    const created = await client.log(jar, title.tmdbId, { watchedDate: "2026-01-01", review: "Gone" });

    const updated = await edit(jar, created.entry.id, { review });

    expect(updated.review).toBeNull();
    expect(await myReviews(jar, title.tmdbId)).toEqual([]);
  });

  it("leaves the review alone when the edit doesn't mention it", async () => {
    const { jar } = await signUpTestUser(baseUrl(), "lrekeep");
    const title = await media.seed();
    const created = await client.log(jar, title.tmdbId, { watchedDate: "2026-01-01", review: "Kept" });

    const updated = await edit(jar, created.entry.id, { rewatch: true });
    expect(updated.review).toMatchObject({ id: created.review!.id, content: "Kept" });
  });

  it("does nothing to another user's review through their log id", async () => {
    const owner = await signUpTestUser(baseUrl(), "lreown");
    const intruder = await signUpTestUser(baseUrl(), "lreint");
    const title = await media.seed();
    const created = await client.log(owner.jar, title.tmdbId, { watchedDate: "2026-01-01", review: "Mine" });

    const response = await client.request(intruder.jar, "PUT", media.logPath(created.entry.id), {
      review: null,
    });
    expect(response.status).toBe(404);
    expect(await myReviews(owner.jar, title.tmdbId)).toHaveLength(1);
  });
});
