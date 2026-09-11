import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, desc, eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestMovie } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { activities } from "../../../src/modules/social/social.entity";

type TrendingItem = {
  mediaType: "movie" | "tv";
  tmdbId: number;
  distinctUserCount: number;
};

describe("GET /api/social/trending", () => {
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

  // Large enough that a seeded test item is never pushed out of the
  // response by unrelated activity from other tests sharing this DB.
  const fetchTrending = async () => {
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/social/trending?limit=1000",
    );
    const body = (await response.json()) as { items: TrendingItem[] };
    return { response, body };
  };

  const logDiaryEntry = async (
    jar: Awaited<ReturnType<typeof signUpTestUser>>["jar"],
    tmdbId: number,
    watchedDate = "2026-01-01",
  ) => {
    await apiRequest(
      getServer().baseUrl,
      "/api/diary",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId, watchedDate }),
      },
      jar,
    );
  };

  const backdateLatestDiaryEntryActivity = async (username: string, daysAgo: number) => {
    const [actor] = await db.select({ id: user.id }).from(user).where(eq(user.username, username)).limit(1);
    if (!actor) throw new Error(`No such user: ${username}`);

    const [row] = await db
      .select({ id: activities.id })
      .from(activities)
      .where(and(eq(activities.userId, actor.id), eq(activities.type, "diary_entry")))
      .orderBy(desc(activities.createdAt))
      .limit(1);
    if (!row) throw new Error(`No diary_entry activity found for ${username}`);

    await db
      .update(activities)
      .set({ createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000) })
      .where(eq(activities.id, row.id));
  };

  it("does not require auth and returns an items array", async () => {
    const { response, body } = await fetchTrending();
    expect(response.status).toBe(200);
    expect(Array.isArray(body.items)).toBe(true);
  });

  it("counts activity from users regardless of follow relationship, and dedupes repeat activity from the same user", async () => {
    const userA = await signUpTestUser(getServer().baseUrl, "sttrendA");
    const userB = await signUpTestUser(getServer().baseUrl, "sttrendB");
    const movieWithTwoUsers = await seedTestMovie("Trending Movie Two Users");
    const movieWithOneUser = await seedTestMovie("Trending Movie One User");

    // userA and userB never follow each other - proves the global scope.
    await logDiaryEntry(userA.jar, movieWithTwoUsers.tmdbId);
    await logDiaryEntry(userB.jar, movieWithTwoUsers.tmdbId);

    // Two diary entries (a rewatch) from the same user must only count once.
    await logDiaryEntry(userA.jar, movieWithOneUser.tmdbId, "2026-01-01");
    await logDiaryEntry(userA.jar, movieWithOneUser.tmdbId, "2026-01-02");

    const { body } = await fetchTrending();
    const twoUserItem = body.items.find((i) => i.tmdbId === movieWithTwoUsers.tmdbId);
    const oneUserItem = body.items.find((i) => i.tmdbId === movieWithOneUser.tmdbId);

    expect(twoUserItem?.distinctUserCount).toBe(2);
    expect(oneUserItem?.distinctUserCount).toBe(1);

    const twoUserIndex = body.items.findIndex((i) => i.tmdbId === movieWithTwoUsers.tmdbId);
    const oneUserIndex = body.items.findIndex((i) => i.tmdbId === movieWithOneUser.tmdbId);
    expect(twoUserIndex).toBeLessThan(oneUserIndex);
  });

  it("excludes activity older than the 7-day trending window", async () => {
    const freshUser = await signUpTestUser(getServer().baseUrl, "sttrendfresh");
    const staleUser = await signUpTestUser(getServer().baseUrl, "sttrendstale");
    const movie = await seedTestMovie("Trending Window Movie");

    await logDiaryEntry(freshUser.jar, movie.tmdbId);
    await logDiaryEntry(staleUser.jar, movie.tmdbId);
    // Pushes staleUser's activity outside the 7-day window - only
    // freshUser's should still count.
    await backdateLatestDiaryEntryActivity(staleUser.username, 8);

    const { body } = await fetchTrending();
    const item = body.items.find((i) => i.tmdbId === movie.tmdbId);
    expect(item?.distinctUserCount).toBe(1);
  });

  it("does not count second-order engagement (commenting on someone else's review) as touching the movie", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "sttrendauthor");
    const commenter = await signUpTestUser(getServer().baseUrl, "sttrendcommenter");
    const movie = await seedTestMovie("Trending Comment-Only Movie");

    const reviewResponse = await apiRequest(
      getServer().baseUrl,
      "/api/reviews",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId: movie.tmdbId, mediaType: "movie", content: "A real review" }),
      },
      author.jar,
    );
    const { review } = (await reviewResponse.json()) as { review: { id: string } };

    await apiRequest(
      getServer().baseUrl,
      `/api/reviews/${review.id}/comments`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Second-order engagement only" }),
      },
      commenter.jar,
    );

    const { body } = await fetchTrending();
    const item = body.items.find((i) => i.tmdbId === movie.tmdbId);
    // Only the review author touched the movie - the commenter's
    // "commented" activity must not add a second distinct user.
    expect(item?.distinctUserCount).toBe(1);
  });
});
