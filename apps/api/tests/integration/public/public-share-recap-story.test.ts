import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { WATCH_LOG_MEDIA, watchLogClient } from "../../support/factories/watch-log.factory";

const [FILM] = WATCH_LOG_MEDIA as [(typeof WATCH_LOG_MEDIA)[0]];

describe("Recap story card (/api/public/og/recap-story)", () => {
  let testServer: RunningTestServer | null = null;
  const baseUrl = () => {
    if (!testServer) throw new Error("Test server is not running");
    return testServer.baseUrl;
  };
  const films = watchLogClient(baseUrl, FILM);

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    await testServer?.close();
    testServer = null;
  });

  it("renders a 1080×1920 story card for a full year with a persona", async () => {
    const { jar, username } = await signUpTestUser(baseUrl(), "storycard");
    const film = await FILM.seed("Story Card Film");
    for (let day = 1; day <= 10; day += 1) {
      await films.logId(jar, film.tmdbId, `2025-01-${String(day).padStart(2, "0")}`);
    }

    const response = await apiRequest(baseUrl(), `/api/public/og/recap-story/${username}/2025.jpg`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("cache-control")).toBe("public, max-age=3600, s-maxage=21600");
    const bytes = new Uint8Array(await response.arrayBuffer());
    expect(bytes.length).toBeGreaterThan(1000);
    expect([...bytes.slice(0, 3)]).toEqual([0xff, 0xd8, 0xff]);
  });

  it("404s for a year without a persona and for unknown users", async () => {
    const { username } = await signUpTestUser(baseUrl(), "storyempt");

    const empty = await apiRequest(baseUrl(), `/api/public/og/recap-story/${username}/2025.jpg`);
    expect(empty.status).toBe(404);
    expect(empty.headers.get("cache-control")).toBe("public, max-age=60, s-maxage=300");

    const missing = await apiRequest(
      baseUrl(),
      "/api/public/og/recap-story/no-such-story-user/2025.jpg",
    );
    expect(missing.status).toBe(404);
  });
});
