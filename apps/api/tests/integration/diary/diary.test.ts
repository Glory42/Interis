import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestFilm } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

// Reading one's own Film diary. The log lifecycle is in watch-log/.
describe("diary", () => {
  let testServer: RunningTestServer | null = null;

  const getServer = (): RunningTestServer => {
    if (!testServer) {
      throw new Error("Test server is not running");
    }
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

  const createEntry = async (
    jar: CookieJar,
    tmdbId: number,
    extra: Record<string, unknown> = {},
  ) => {
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/diary",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId, watchedDate: "2026-01-01", ...extra }),
      },
      jar,
    );
    const body = (await response.json()) as {
      entry: { id: string };
      movie: { id: number; tmdbId: number };
      review: { id: string; content: string } | null;
    };
    return { response, body };
  };

  describe("GET /api/diary", () => {
    it("requires auth", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/diary");
      expect(response.status).toBe(401);
    });

    it("bounds the list with limit/offset instead of returning everything", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "dpage");
      const movies = await Promise.all([
        seedTestFilm("Diary Page Movie 1"),
        seedTestFilm("Diary Page Movie 2"),
        seedTestFilm("Diary Page Movie 3"),
      ]);
      await createEntry(jar, movies[0]!.tmdbId, { watchedDate: "2026-01-01" });
      await createEntry(jar, movies[1]!.tmdbId, { watchedDate: "2026-01-02" });
      await createEntry(jar, movies[2]!.tmdbId, { watchedDate: "2026-01-03" });

      const firstPageResponse = await apiRequest(
        getServer().baseUrl,
        "/api/diary?limit=2",
        {},
        jar,
      );
      const firstPage = (await firstPageResponse.json()) as unknown[];
      expect(firstPage.length).toBe(2);

      const secondPageResponse = await apiRequest(
        getServer().baseUrl,
        "/api/diary?limit=2&offset=2",
        {},
        jar,
      );
      const secondPage = (await secondPageResponse.json()) as unknown[];
      expect(secondPage.length).toBe(1);
    });

    it("falls back to the default bound on an out-of-range limit instead of erroring", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "dbadlimit");
      const movie = await seedTestFilm("Diary Bad Limit Movie");
      await createEntry(jar, movie.tmdbId);

      // DiaryQuerySchema caps limit at 2000 — an out-of-range value should
      // fail schema validation and fall back to the default bound rather
      // than 400ing or silently returning everything.
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/diary?limit=999999",
        {},
        jar,
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as unknown[];
      expect(body.length).toBe(1);
    });
  });
});
