import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestMovie, seedTestSerial } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

describe("profile diary liked mark", () => {
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

  const send = async (jar: CookieJar, path: string, method: string, body: unknown) => {
    const response = await apiRequest(
      getServer().baseUrl,
      path,
      { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
      jar,
    );
    expect(response.ok).toBe(true);
  };

  it("marks each diary entry liked from the title's own like, films and series alike", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "dlike");
    const likedMovie = await seedTestMovie("Liked Diary Movie");
    const plainMovie = await seedTestMovie("Plain Diary Movie");
    const likedSerial = await seedTestSerial("Liked Diary Serial");

    await send(jar, "/api/diary", "POST", { tmdbId: likedMovie.tmdbId, watchedDate: "2026-02-01" });
    await send(jar, "/api/diary", "POST", { tmdbId: plainMovie.tmdbId, watchedDate: "2026-02-02" });
    await send(jar, `/api/serials/${likedSerial.tmdbId}/log`, "POST", { watchedDate: "2026-02-03" });
    await send(jar, `/api/interactions/${likedMovie.tmdbId}`, "PUT", { liked: true });
    await send(jar, `/api/serials/${likedSerial.tmdbId}/interaction`, "PUT", { liked: true });

    const response = await apiRequest(getServer().baseUrl, `/api/users/${username}/diary`);
    expect(response.status).toBe(200);
    const items = (await response.json()) as { media: { tmdbId: number }; liked: boolean }[];
    const likedByTmdbId = new Map(items.map((item) => [item.media.tmdbId, item.liked]));

    expect(likedByTmdbId.get(likedMovie.tmdbId)).toBe(true);
    expect(likedByTmdbId.get(plainMovie.tmdbId)).toBe(false);
    expect(likedByTmdbId.get(likedSerial.tmdbId)).toBe(true);
  });
});
