import { afterAll, beforeAll, describe, expect, it, spyOn } from "bun:test";
import { eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { UsersStatsRepository } from "../../../src/modules/users/repositories/users-stats.repository";
import {
  createUsersStatsCache,
  UsersStatsCacheService,
} from "../../../src/modules/users/services/users-stats-cache.service";

const userIdOf = async (username: string): Promise<string> => {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
  if (!row) throw new Error(`Test user ${username} not found`);
  return row.id;
};

describe("profile stats cache", () => {
  let testServer: RunningTestServer | null = null;

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    await testServer?.close();
    testServer = null;
  });

  it("serves repeat viewers from memory, but the owner and a forgotten user read fresh", async () => {
    const { username } = await signUpTestUser(testServer!.baseUrl, "statscache");
    const userId = await userIdOf(username);
    const cache = createUsersStatsCache({ countsMs: 60_000, detailedMs: 60_000, networkMs: 60_000 });
    const counts = spyOn(UsersStatsRepository, "getStatsCounts");

    try {
      await cache.statsCounts(userId, false);
      await cache.statsCounts(userId, false);
      expect(counts).toHaveBeenCalledTimes(1);

      await cache.statsCounts(userId, true);
      expect(counts).toHaveBeenCalledTimes(2);

      cache.forget(userId);
      await cache.statsCounts(userId, false);
      expect(counts).toHaveBeenCalledTimes(3);
    } finally {
      counts.mockRestore();
    }
  });

  it("drops both sides' cached counts when a follow edge changes", async () => {
    const baseUrl = testServer!.baseUrl;
    const follower = await signUpTestUser(baseUrl, "statsfollower");
    const followed = await signUpTestUser(baseUrl, "statsfollowed");
    const [followerId, followedId] = await Promise.all([userIdOf(follower.username), userIdOf(followed.username)]);
    const forget = spyOn(UsersStatsCacheService, "forgetFollowEdge");

    try {
      const followed1 = await apiRequest(baseUrl, `/api/social/follow/${followed.username}`, { method: "POST" }, follower.jar);
      expect(followed1.ok).toBe(true);
      expect(forget).toHaveBeenCalledWith(followerId, followedId);

      forget.mockClear();
      await apiRequest(baseUrl, `/api/social/follow/${followed.username}`, { method: "DELETE" }, follower.jar);
      expect(forget).toHaveBeenCalledWith(followerId, followedId);
    } finally {
      forget.mockRestore();
    }
  });
});
