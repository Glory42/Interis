import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestFilm, seedTestSeries } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { activities } from "../../../src/modules/social/social.entity";
import type { ActivityType } from "../../../src/modules/social/repositories/social.repository";

// Media activities are recorded fire-and-forget, so give the insert a
// moment to land before asserting on it.
const waitForActivityWrite = () => new Promise((resolve) => setTimeout(resolve, 150));

type InteractionBody = {
  liked: boolean;
  watchlisted: boolean;
  rating: number | null;
  watched: boolean;
};

// One case table, run for each media kind through its own HTTP route.
const KINDS = [
  {
    name: "Film",
    seed: seedTestFilm,
    path: (tmdbId: number) => `/api/interactions/${tmdbId}`,
    emptyState: { liked: false, watchlisted: false, rating: null, watched: false },
    ratingImpliesWatched: true,
  },
  {
    name: "Series",
    seed: seedTestSeries,
    path: (tmdbId: number) => `/api/serials/${tmdbId}/interaction`,
    emptyState: { liked: false, watchlisted: false, rating: null, watched: false, watchStatus: null },
    // Rating a series says nothing about which episodes were seen (#66).
    ratingImpliesWatched: false,
  },
];

const getUserId = async (username: string): Promise<string> => {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
  if (!row) throw new Error(`Test user ${username} not found`);
  return row.id;
};

const countActivities = async (userId: string, type: ActivityType) => {
  const rows = await db
    .select({ id: activities.id })
    .from(activities)
    .where(and(eq(activities.userId, userId), eq(activities.type, type)));
  return rows.length;
};

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

for (const kind of KINDS) describe(`${kind.name} Interaction`, () => {
  const setup = async (prefix: string) => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, `${kind.name.toLowerCase()}${prefix}`);
    const media = await kind.seed();
    return { jar, userId: await getUserId(username), path: kind.path(media.tmdbId) };
  };

  const put = async (jar: CookieJar, path: string, body: unknown) => {
    const response = await apiRequest(
      getServer().baseUrl,
      path,
      { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
      jar,
    );
    expect(response.status).toBe(200);
    return (await response.json()) as InteractionBody;
  };

  it("requires auth to read or write", async () => {
    const media = await kind.seed();
    const path = kind.path(media.tmdbId);

    expect((await apiRequest(getServer().baseUrl, path)).status).toBe(401);
    const putResponse = await apiRequest(getServer().baseUrl, path, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ liked: true }),
    });
    expect(putResponse.status).toBe(401);
  });

  it("defaults to the empty state before any interaction exists", async () => {
    const { jar, path } = await setup("def");
    const response = await apiRequest(getServer().baseUrl, path, {}, jar);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(kind.emptyState);
  });

  it("persists a partial update without clobbering other fields", async () => {
    const { jar, path } = await setup("par");
    await put(jar, path, { liked: true });
    expect(await put(jar, path, { watchlisted: true })).toMatchObject({ liked: true, watchlisted: true });

    const response = await apiRequest(getServer().baseUrl, path, {}, jar);
    expect(await response.json()).toMatchObject({ liked: true, watchlisted: true });
  });

  it("records a like once, and retracts it on unlike", async () => {
    const { jar, userId, path } = await setup("like");
    await put(jar, path, { liked: true });
    await waitForActivityWrite();
    expect(await countActivities(userId, "liked_movie")).toBe(1);

    // Re-sending `liked: true` is not news (#79).
    await put(jar, path, { liked: true });
    await put(jar, path, { liked: true, rating: 7 });
    await waitForActivityWrite();
    expect(await countActivities(userId, "liked_movie")).toBe(1);

    await put(jar, path, { liked: false });
    expect(await countActivities(userId, "liked_movie")).toBe(0);

    // A real off -> on flip is news again.
    await put(jar, path, { liked: true });
    await waitForActivityWrite();
    expect(await countActivities(userId, "liked_movie")).toBe(1);
  });

  it("records a watchlist add, and retracts it on remove", async () => {
    const { jar, userId, path } = await setup("wl");
    expect(await put(jar, path, { watchlisted: true })).toMatchObject({ watchlisted: true });
    await put(jar, path, { watchlisted: true });
    await waitForActivityWrite();
    expect(await countActivities(userId, "watchlisted_movie")).toBe(1);

    expect(await put(jar, path, { watchlisted: false })).toMatchObject({ watchlisted: false });
    expect(await countActivities(userId, "watchlisted_movie")).toBe(0);
  });

  it("watching clears the watchlist without retracting its Activity", async () => {
    const { jar, userId, path } = await setup("watch");
    await put(jar, path, { watchlisted: true });
    await waitForActivityWrite();

    expect(await put(jar, path, { watched: true })).toMatchObject({ watched: true, watchlisted: false });
    expect(await countActivities(userId, "watchlisted_movie")).toBe(1);

    // Already off the watchlist, so an explicit remove has nothing to undo.
    await put(jar, path, { watchlisted: false });
    expect(await countActivities(userId, "watchlisted_movie")).toBe(1);
  });

  it("liking or rating a watchlisted title takes it off the watchlist", async () => {
    const { jar, path } = await setup("wlclr");
    await put(jar, path, { watchlisted: true });
    expect(await put(jar, path, { liked: true })).toMatchObject({ liked: true, watchlisted: false });

    await put(jar, path, { watchlisted: true });
    expect(await put(jar, path, { rating: 9 })).toMatchObject({ rating: 9, watchlisted: false });
  });

  it("sets, changes and clears the rating", async () => {
    const { jar, path } = await setup("rate");
    expect(await put(jar, path, { rating: 8 })).toMatchObject({
      rating: 8,
      watched: kind.ratingImpliesWatched,
    });
    expect(await put(jar, path, { rating: 6.5 })).toMatchObject({ rating: 6.5 });
    expect(await put(jar, path, { rating: null })).toMatchObject({ rating: null });

    const response = await apiRequest(getServer().baseUrl, path, {}, jar);
    expect(await response.json()).toMatchObject({ rating: null });
  });
});
