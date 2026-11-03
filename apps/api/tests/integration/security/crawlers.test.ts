import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

const GOOGLEBOT =
  "Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.8010.52 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
const SPOOFED_SCRAPER_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
  "sec-ch-ua-platform": '"Linux"',
};

describe("crawler blocking", () => {
  let testServer: RunningTestServer | null = null;

  const getServer = (): RunningTestServer => {
    if (!testServer) {
      throw new Error("Test server is not running");
    }

    return testServer;
  };

  const get = (path: string, headers: Record<string, string>) =>
    apiRequest(getServer().baseUrl, path, { headers });

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    if (!testServer) {
      return;
    }

    await testServer.close();
    testServer = null;
  });

  it("refuses crawlers on TMDB mirror endpoints before any DB work", async () => {
    for (const path of ["/api/movies/550/detail", "/api/people/actor/jane-doe", "/api/movies/trending"]) {
      const response = await get(path, { "user-agent": GOOGLEBOT });
      expect(response.status).toBe(403);
    }
  });

  it("lets crawlers read public profile endpoints", async () => {
    const response = await get("/api/users/no-such-user-crawler-test", { "user-agent": GOOGLEBOT });
    expect(response.status).toBe(404);
  });

  it("refuses crawlers on the viewer's own and network endpoints", async () => {
    for (const path of ["/api/users/me", "/api/users/stats/network", "/api/users?q=a"]) {
      const response = await get(path, { "user-agent": GOOGLEBOT });
      expect(response.status).toBe(403);
    }
  });

  it("refuses spoofed browsers everywhere, including profiles", async () => {
    const response = await get("/api/users/no-such-user-crawler-test", SPOOFED_SCRAPER_HEADERS);
    expect(response.status).toBe(403);
  });

  it("keeps health and robots.txt open to monitors and crawlers", async () => {
    expect((await get("/api/health", { "user-agent": GOOGLEBOT })).status).toBe(200);
    expect((await get("/robots.txt", { "user-agent": GOOGLEBOT })).status).toBe(200);
  });

  it("serves regular browsers normally", async () => {
    const response = await get("/api/users/no-such-user-crawler-test", {});
    expect(response.status).toBe(404);
  });
});
