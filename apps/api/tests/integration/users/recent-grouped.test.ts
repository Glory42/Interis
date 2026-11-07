import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestFilm } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

// Likes are recorded fire-and-forget, so give the inserts a moment to land.
const waitForActivityWrites = () => new Promise((resolve) => setTimeout(resolve, 200));

type Entry =
  | { kind: "title"; movie: { tmdbId: number }; watched: boolean; rating: number | null; liked: boolean; review: { content: string } | null }
  | { kind: "activity"; item: { id: string } };

describe("GET /api/users/:username/recent/grouped", () => {
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

  it("shows one row per title per day on a profile, readable by anyone", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "recgrp");
    const movie = await seedTestFilm("Profile Grouped Movie");

    await send(jar, "/api/diary", "POST", { tmdbId: movie.tmdbId, watchedDate: "2026-02-01", rating: 8 });
    await send(jar, `/api/interactions/${movie.tmdbId}`, "PUT", { liked: true });
    await send(jar, "/api/reviews", "POST", { tmdbId: movie.tmdbId, content: "Profile grouped review" });
    await waitForActivityWrites();

    const response = await apiRequest(getServer().baseUrl, `/api/users/${username}/recent/grouped?limit=20`);
    expect(response.status).toBe(200);
    const entries = (await response.json()) as Entry[];
    const rows = entries.filter(
      (entry): entry is Extract<Entry, { kind: "title" }> => entry.kind === "title" && entry.movie.tmdbId === movie.tmdbId,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ watched: true, rating: 8, liked: true });
    expect(rows[0]!.review?.content).toBe("Profile grouped review");
  });

  it("404s for an unknown user", async () => {
    const response = await apiRequest(getServer().baseUrl, "/api/users/no-such-user-xyz/recent/grouped");
    expect(response.status).toBe(404);
  });
});
