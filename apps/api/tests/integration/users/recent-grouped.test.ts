import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestFilm } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import type { FeedRowJson } from "../../support/app/following-feed";
import { db } from "../../../src/infrastructure/database/db";
import { activities } from "../../../src/modules/social/social.entity";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { eq } from "drizzle-orm";

// Likes are recorded fire-and-forget, so give the inserts a moment to land.
const waitForActivityWrites = () => new Promise((resolve) => setTimeout(resolve, 200));

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

  const getRows = async (username: string, query: string): Promise<FeedRowJson[]> => {
    const response = await apiRequest(getServer().baseUrl, `/api/users/${username}/recent/grouped?${query}`);
    expect(response.status).toBe(200);
    return (await response.json()) as FeedRowJson[];
  };

  it("shows one row per title per day on a profile, readable by anyone", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "recgrp");
    const movie = await seedTestFilm("Profile Grouped Movie");

    await send(jar, "/api/diary", "POST", { tmdbId: movie.tmdbId, watchedDate: "2026-02-01", rating: 8 });
    await send(jar, `/api/interactions/${movie.tmdbId}`, "PUT", { liked: true });
    await send(jar, "/api/reviews", "POST", { tmdbId: movie.tmdbId, content: "Profile grouped review" });
    await waitForActivityWrites();

    const rows = (await getRows(username, "limit=20")).filter(
      (row) => row.kind === "title" && row.group.movie.tmdbId === movie.tmdbId,
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ group: { watched: true, rating: 8, liked: true, review: { content: "Profile grouped review" } } });
  });

  it("counts a run of likes as one row, so older activity still shows", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "recrun");
    const logged = await seedTestFilm("Logged Before The Likes");
    await send(jar, "/api/diary", "POST", { tmdbId: logged.tmdbId, watchedDate: "2026-02-01" });
    await waitForActivityWrites();

    for (let index = 0; index < 25; index += 1) {
      const liked = await seedTestFilm(`Run Like ${index}`);
      await send(jar, `/api/interactions/${liked.tmdbId}`, "PUT", { liked: true });
    }
    await waitForActivityWrites();

    const rows = await getRows(username, "limit=2");
    expect(rows).toMatchObject([
      { kind: "titles", action: "liked" },
      { kind: "title", group: { movie: { tmdbId: logged.tmdbId }, watched: true } },
    ]);
    expect(rows[0]!.kind === "titles" && rows[0]!.titles).toHaveLength(25);
  });

  it("splits days in the viewer's time zone", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "rectz");
    const films = await Promise.all([seedTestFilm("Profile tz one"), seedTestFilm("Profile tz two")]);
    for (const film of films) await send(jar, `/api/interactions/${film.tmdbId}`, "PUT", { liked: true });
    await waitForActivityWrites();

    // 22:30 and 00:30 UTC: two UTC days, but 01:30 and 03:30 on one day in Istanbul.
    const [owner] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
    const times = new Map([[films[0].id, "2026-03-02T22:30:00Z"], [films[1].id, "2026-03-03T00:30:00Z"]]);
    for (const row of await db.select().from(activities).where(eq(activities.userId, owner!.id))) {
      const movieId = (JSON.parse(row.metadata ?? "{}") as { movieId?: number }).movieId;
      const at = movieId === undefined ? undefined : times.get(movieId);
      if (at) await db.update(activities).set({ createdAt: new Date(at) }).where(eq(activities.id, row.id));
    }

    const inIstanbul = await getRows(username, "limit=10&tz=Europe/Istanbul");
    expect(inIstanbul.map((row) => `${row.day} ${row.kind}`)).toEqual(["2026-03-03 titles"]);
    const inUtc = await getRows(username, "limit=10");
    expect(inUtc.map((row) => `${row.day} ${row.kind}`)).toEqual(["2026-03-03 title", "2026-03-02 title"]);
  });

  it("404s for an unknown user", async () => {
    const response = await apiRequest(getServer().baseUrl, "/api/users/no-such-user-xyz/recent/grouped");
    expect(response.status).toBe(404);
  });
});
