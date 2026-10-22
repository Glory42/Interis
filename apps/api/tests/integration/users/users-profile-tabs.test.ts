import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestSerial } from "../../support/factories/media.factory";
import type { CookieJar } from "../../support/app/cookie-jar";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { tvSeries } from "../../../src/modules/serials/serials.entity";

// The in-app profile tabs read these uncached /api/users routes instead of the
// widget API, whose 5-minute response cache would hide a user's own changes.
describe("users profile tabs (uncached in-app routes)", () => {
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

  const setEpisodeWatched = async (jar: CookieJar, tmdbId: number, watched: boolean) =>
    apiRequest(
      getServer().baseUrl,
      `/api/serials/${tmdbId}/seasons/1/episodes/1/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watched }),
      },
      jar,
    );

  it("reflects watching and unwatching an episode on the next read", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "tabswatching");
    const serial = await seedTestSerial("Profile Tabs Serial");
    await db
      .update(tvSeries)
      .set({ numberOfEpisodes: 10, numberOfSeasons: 1 })
      .where(eq(tvSeries.id, serial.id));

    const read = async () => {
      const response = await apiRequest(
        getServer().baseUrl,
        `/api/users/${username}/serials/currently-watching`,
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
      return (await response.json()) as Array<{ tmdbId: number }>;
    };

    await setEpisodeWatched(jar, serial.tmdbId, true);
    expect((await read()).map((item) => item.tmdbId)).toEqual([serial.tmdbId]);

    await setEpisodeWatched(jar, serial.tmdbId, false);
    expect(await read()).toEqual([]);
  });

  it("serves diary, top4 and recent without the public cache headers", async () => {
    const { username } = await signUpTestUser(getServer().baseUrl, "tabsother");

    for (const path of ["diary", "top4", "recent"]) {
      const response = await apiRequest(getServer().baseUrl, `/api/users/${username}/${path}`);
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("private, no-store");
    }
  });

  it("returns 404 for an unknown user", async () => {
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/users/no-such-user-tabs/serials/currently-watching",
    );
    expect(response.status).toBe(404);
  });
});
