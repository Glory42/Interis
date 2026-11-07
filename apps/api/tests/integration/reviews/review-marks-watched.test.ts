import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { signUpTestUser } from "../../support/app/auth-flow";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { WATCH_LOG_MEDIA, watchLogClient } from "../../support/factories/watch-log.factory";

// Reviewing a title says it was watched, so it leaves the Watchlist, for
// Films and Series alike.
describe.each(WATCH_LOG_MEDIA)("reviewing a $label", (media) => {
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

  it("marks it watched and takes it off the Watchlist", async () => {
    const { jar } = await signUpTestUser(baseUrl(), "rvwatch");
    const title = await media.seed();
    await client.setInteraction(jar, title.tmdbId, { watchlisted: true });

    await client.send(jar, "POST", "/api/reviews", {
      tmdbId: title.tmdbId,
      mediaType: media.mediaType,
      content: "Seen it",
    });

    expect(await client.interaction(jar, title.tmdbId)).toMatchObject({
      watched: true,
      watchlisted: false,
    });
  });
});
