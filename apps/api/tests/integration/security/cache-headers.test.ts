import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestFilm, seedTestSeries } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

// Shared caches (Cloudflare) may keep only what is the same for every viewer.
describe("Cache-Control on Film/Series reads", () => {
  let testServer: RunningTestServer | null = null;

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    await testServer?.close();
    testServer = null;
  });

  it("lets shared caches keep a signed-out detail page, never the browser or a signed-in one", async () => {
    const baseUrl = testServer!.baseUrl;
    const movie = await seedTestFilm("Cache Header Movie");

    const anonymous = await apiRequest(baseUrl, `/api/movies/${movie.tmdbId}/detail`);
    expect(anonymous.status).toBe(200);
    expect(anonymous.headers.get("cache-control")).toBe("public, max-age=0, s-maxage=60");
    expect(anonymous.headers.get("vary")).toContain("Cookie");

    const { jar } = await signUpTestUser(baseUrl, "cachehdr");
    const signedIn = await apiRequest(baseUrl, `/api/movies/${movie.tmdbId}/detail`, {}, jar);
    expect(signedIn.status).toBe(200);
    expect(signedIn.headers.get("cache-control")).toBe("private, no-store");
  });

  it("treats any auth cookie as signed in, even an expired access token", async () => {
    const series = await seedTestSeries("Cache Header Serial");
    const response = await fetch(`${testServer!.baseUrl}/api/serials/${series.tmdbId}/reviews`, {
      headers: { cookie: "interis_refresh_token=stale" },
    });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });

  it("marks the viewer-independent title row public for browsers too", async () => {
    const movie = await seedTestFilm("Cache Header Title");
    const response = await apiRequest(testServer!.baseUrl, `/api/movies/${movie.tmdbId}`);
    expect(response.headers.get("cache-control")).toBe("public, max-age=300, s-maxage=3600");
  });
});
