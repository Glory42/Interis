import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { signUpTestUser, type SignedUpTestUser } from "../../support/app/auth-flow";
import { promoteToAdmin } from "../../support/factories/admin.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import {
  WATCH_LOG_MEDIA,
  diaryActivitiesOf,
  waitForActivityWrite,
  watchLogClient,
} from "../../support/factories/watch-log.factory";

type AdminLogRow = {
  id: string;
  mediaType: string;
  mediaId: number;
  mediaTitle: string;
  authorUsername: string;
  movieId?: number;
  movieTitle?: string;
};

// Moderators list and remove Film and Series logs through /api/admin/diary.
describe.each(WATCH_LOG_MEDIA)("admin moderation of $label logs", (media) => {
  let testServer: RunningTestServer | null = null;
  let admin: SignedUpTestUser;
  const baseUrl = () => {
    if (!testServer) throw new Error("Test server is not running");
    return testServer.baseUrl;
  };
  const client = watchLogClient(baseUrl, media);

  beforeAll(async () => {
    testServer = await startTestServer();
    admin = await signUpTestUser(baseUrl(), "wladm");
    await promoteToAdmin(admin.username);
  });

  afterAll(async () => {
    await testServer?.close();
    testServer = null;
  });

  const listFor = async (username: string, query = `&mediaType=${media.mediaType}`) =>
    (await client.send(admin.jar, "GET", `/api/admin/diary?username=${username}${query}`)) as unknown as AdminLogRow[];

  it("lists the user's logs with their media type and title", async () => {
    const author = await signUpTestUser(baseUrl(), "wlalist");
    const title = await media.seed("Moderated Title");
    const entryId = await client.logId(author.jar, title.tmdbId, "2026-01-01", 7);

    expect(await listFor(author.username)).toMatchObject([
      {
        id: entryId,
        mediaType: media.mediaType,
        mediaId: title.id,
        mediaTitle: "Moderated Title",
        authorUsername: author.username,
      },
    ]);
  });

  it("removes a log, its feed Activity and follows the user's rating", async () => {
    const author = await signUpTestUser(baseUrl(), "wlarm");
    const title = await media.seed();
    await client.logId(author.jar, title.tmdbId, "2026-01-01", 6);
    const latestId = await client.logId(author.jar, title.tmdbId, "2026-03-01", 8);
    await waitForActivityWrite();

    await client.send(admin.jar, "DELETE", `/api/admin/diary/${latestId}`);

    expect((await listFor(author.username)).map((row) => row.id)).not.toContain(latestId);
    expect((await diaryActivitiesOf(author.username)).map((row) => row.entityId)).not.toContain(
      latestId,
    );
    expect((await client.interaction(author.jar, title.tmdbId)).rating).toBe(6);
    const again = await client.request(admin.jar, "DELETE", `/api/admin/diary/${latestId}`);
    expect(again.status).toBe(404);
  });

  it("is admin only", async () => {
    const author = await signUpTestUser(baseUrl(), "wlanot");
    const title = await media.seed();
    const entryId = await client.logId(author.jar, title.tmdbId, "2026-01-01");
    const response = await client.request(author.jar, "DELETE", `/api/admin/diary/${entryId}`);
    expect(response.status).toBe(403);
  });
});

describe("admin log listing defaults", () => {
  let testServer: RunningTestServer | null = null;
  const baseUrl = () => testServer!.baseUrl;
  const [film, series] = WATCH_LOG_MEDIA as [(typeof WATCH_LOG_MEDIA)[0], (typeof WATCH_LOG_MEDIA)[1]];

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    await testServer?.close();
    testServer = null;
  });

  it("lists Film logs, in their old shape, when no media type is asked for", async () => {
    const admin = await signUpTestUser(baseUrl(), "wladef");
    await promoteToAdmin(admin.username);
    const author = await signUpTestUser(baseUrl(), "wlaauth");
    const filmTitle = await film.seed("Default Film");
    const seriesTitle = await series.seed();
    const filmLogId = await watchLogClient(baseUrl, film).logId(author.jar, filmTitle.tmdbId, "2026-01-01");
    await watchLogClient(baseUrl, series).logId(author.jar, seriesTitle.tmdbId, "2026-01-01");

    const rows = (await watchLogClient(baseUrl, film).send(
      admin.jar,
      "GET",
      `/api/admin/diary?username=${author.username}`,
    )) as unknown as AdminLogRow[];
    expect(rows).toMatchObject([
      { id: filmLogId, mediaType: "movie", movieId: filmTitle.id, movieTitle: "Default Film" },
    ]);
  });
});
