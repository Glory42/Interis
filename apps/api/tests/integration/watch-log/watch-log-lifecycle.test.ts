import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { signUpTestUser } from "../../support/app/auth-flow";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import {
  WATCH_LOG_MEDIA,
  diaryActivitiesOf,
  waitForActivityWrite,
  watchLogClient,
} from "../../support/factories/watch-log.factory";

// Create, edit and remove a Diary Entry, once per media type.
describe.each(WATCH_LOG_MEDIA)("$label watch log lifecycle", (media) => {
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

  it("requires auth to log", async () => {
    const title = await media.seed();
    const response = await client.request(
      undefined,
      "POST",
      media.createPath(title.tmdbId),
      media.createBody(title.tmdbId, { watchedDate: "2026-01-01" }),
    );
    expect(response.status).toBe(401);
  });

  it("rejects a rating off the half-step scale", async () => {
    const { jar } = await signUpTestUser(baseUrl(), "wlrate");
    const title = await media.seed();
    const response = await client.request(
      jar,
      "POST",
      media.createPath(title.tmdbId),
      media.createBody(title.tmdbId, { watchedDate: "2026-01-01", rating: 3.3 }),
    );
    expect(response.status).toBe(400);
  });

  it("logs with an attached review and marks the title watched", async () => {
    const { jar } = await signUpTestUser(baseUrl(), "wlrev");
    const title = await media.seed();

    const created = await client.log(jar, title.tmdbId, {
      watchedDate: "2026-01-01",
      rating: 7.5,
      review: "  Loved it  ",
      containsSpoilers: true,
    });

    expect(created.entry.rating).toBe(7.5);
    expect(created.entry[media.mediaIdKey]).toBe(title.id);
    expect((created[media.titleKey] as { tmdbId: number }).tmdbId).toBe(title.tmdbId);
    expect(created.review).toMatchObject({ content: "Loved it", containsSpoilers: true });
    expect((await client.interaction(jar, title.tmdbId)).watched).toBe(true);
  });

  it("shows the log's rating and date on its review in the title's reviews", async () => {
    const { jar } = await signUpTestUser(baseUrl(), "wlrevrow");
    const title = await media.seed();
    await client.log(jar, title.tmdbId, { watchedDate: "2026-02-03", rating: 8, review: "Rated" });

    const detail = (await client.send(undefined, "GET", media.detailPath(title.tmdbId))) as {
      reviews: Array<{ content: string; rating: number | null; watchedDate: string | null }>;
    };
    expect(detail.reviews).toMatchObject([{ content: "Rated", rating: 8, watchedDate: "2026-02-03" }]);
  });

  it("logs without a review when no text is given", async () => {
    const { jar } = await signUpTestUser(baseUrl(), "wlnorev");
    const title = await media.seed();
    const created = await client.log(jar, title.tmdbId, { watchedDate: "2026-01-01", review: "  " });
    expect(created.review).toBeNull();
  });

  it("takes the title off the Watchlist when it is logged", async () => {
    const { jar } = await signUpTestUser(baseUrl(), "wlwatch");
    const title = await media.seed();
    await client.setInteraction(jar, title.tmdbId, { watchlisted: true });

    await client.logId(jar, title.tmdbId, "2026-01-01");

    expect(await client.interaction(jar, title.tmdbId)).toMatchObject({
      watchlisted: false,
      watched: true,
    });
  });

  it("records a feed Activity for the log and retracts it on delete", async () => {
    const { jar, username } = await signUpTestUser(baseUrl(), "wlfeed");
    const title = await media.seed();
    const created = await client.log(jar, title.tmdbId, {
      watchedDate: "2026-01-01",
      rating: 6,
      review: "Worth it",
    });
    await waitForActivityWrite();

    const [activity] = await diaryActivitiesOf(username);
    expect(activity?.entityId).toBe(created.entry.id);
    const metadata = JSON.parse(activity!.metadata ?? "{}") as Record<string, unknown>;
    expect(metadata).toMatchObject({
      mediaType: media.mediaType,
      rating: 6,
      rewatch: false,
      hasReview: true,
      reviewId: created.review!.id,
    });
    expect(metadata).not.toHaveProperty("excerpt");

    await client.send(jar, "DELETE", media.logPath(created.entry.id));
    expect(await diaryActivitiesOf(username)).toEqual([]);
  });

  it("edits the log's date, rating and rewatch flag", async () => {
    const { jar } = await signUpTestUser(baseUrl(), "wledit");
    const title = await media.seed();
    const entryId = await client.logId(jar, title.tmdbId, "2026-01-01", 6);

    const updated = await client.send(jar, "PUT", media.logPath(entryId), {
      watchedDate: "2026-02-01",
      rating: 9,
      rewatch: true,
    });
    expect(updated).toMatchObject({
      id: entryId,
      [media.mediaIdKey]: title.id,
      watchedDate: "2026-02-01",
      rating: 9,
      rewatch: true,
    });
  });

  it("hides another user's log from edit and delete (404)", async () => {
    const owner = await signUpTestUser(baseUrl(), "wlown");
    const intruder = await signUpTestUser(baseUrl(), "wlint");
    const title = await media.seed();
    const entryId = await client.logId(owner.jar, title.tmdbId, "2026-01-01");
    const missingId = "00000000-0000-0000-0000-000000000000";

    for (const id of [entryId, missingId]) {
      const update = await client.request(intruder.jar, "PUT", media.logPath(id), { rating: 5 });
      expect(update.status).toBe(404);
      const remove = await client.request(intruder.jar, "DELETE", media.logPath(id));
      expect(remove.status).toBe(404);
    }
  });

  describe("deleting a log", () => {
    it("keeps the title watched by default", async () => {
      const { jar } = await signUpTestUser(baseUrl(), "wldkeep");
      const title = await media.seed();
      const entryId = await client.logId(jar, title.tmdbId, "2026-01-01");

      expect(await client.send(jar, "DELETE", media.logPath(entryId))).toEqual({
        success: true,
        unwatched: false,
      });
      expect((await client.interaction(jar, title.tmdbId)).watched).toBe(true);
    });

    it("unwatches the title when its last log goes and that is asked", async () => {
      const { jar } = await signUpTestUser(baseUrl(), "wldlast");
      const title = await media.seed();
      const entryId = await client.logId(jar, title.tmdbId, "2026-01-01");

      expect(await client.send(jar, "DELETE", `${media.logPath(entryId)}?unwatch=true`)).toEqual({
        success: true,
        unwatched: true,
      });
      expect((await client.interaction(jar, title.tmdbId)).watched).toBe(false);
    });

    it("keeps the title watched while another log of it remains", async () => {
      const { jar } = await signUpTestUser(baseUrl(), "wldmore");
      const title = await media.seed();
      const firstId = await client.logId(jar, title.tmdbId, "2026-01-01");
      await client.logId(jar, title.tmdbId, "2026-01-02");

      expect(await client.send(jar, "DELETE", `${media.logPath(firstId)}?unwatch=true`)).toEqual({
        success: true,
        unwatched: false,
      });
      expect((await client.interaction(jar, title.tmdbId)).watched).toBe(true);
    });

    it("keeps the attached review, unattached", async () => {
      const { jar } = await signUpTestUser(baseUrl(), "wldrev");
      const title = await media.seed();
      const created = await client.log(jar, title.tmdbId, {
        watchedDate: "2026-01-01",
        review: "Still stands",
      });

      await client.send(jar, "DELETE", media.logPath(created.entry.id));
      const mine = await client.send(
        jar,
        "GET",
        `/api/reviews/mine?mediaType=${media.mediaType}&tmdbId=${title.tmdbId}`,
      );
      expect(mine).toMatchObject([
        { id: created.review!.id, content: "Still stands", diaryEntryId: null },
      ]);
    });

    it("rejects an unreadable unwatch value", async () => {
      const { jar } = await signUpTestUser(baseUrl(), "wldbad");
      const title = await media.seed();
      const entryId = await client.logId(jar, title.tmdbId, "2026-01-01");
      const response = await client.request(jar, "DELETE", `${media.logPath(entryId)}?unwatch=maybe`);
      expect(response.status).toBe(400);
    });
  });
});
