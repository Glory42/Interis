import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";

const userIdOf = async (username: string): Promise<string> => {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
  if (!row) throw new Error(`Test user ${username} not found`);
  return row.id;
};

describe("social following status", () => {
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

  it("requires auth", async () => {
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/social/following-status?userIds=abc",
    );
    expect(response.status).toBe(401);
  });

  it("returns the subset of ids the viewer follows", async () => {
    const viewer = await signUpTestUser(getServer().baseUrl, "fsviewer");
    const followed = await signUpTestUser(getServer().baseUrl, "fsfollowed");
    const other = await signUpTestUser(getServer().baseUrl, "fsother");

    await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${followed.username}`,
      { method: "POST" },
      viewer.jar,
    );
    // Following the viewer must not count as the viewer following back.
    await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${viewer.username}`,
      { method: "POST" },
      other.jar,
    );

    const [followedId, otherId, viewerId] = await Promise.all([
      userIdOf(followed.username),
      userIdOf(other.username),
      userIdOf(viewer.username),
    ]);

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/social/following-status?userIds=${followedId},${otherId},${viewerId},${followedId}`,
      {},
      viewer.jar,
    );
    expect(response.status).toBe(200);
    expect((await response.json()) as { followingIds: string[] }).toEqual({
      followingIds: [followedId],
    });

    await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${followed.username}`,
      { method: "DELETE" },
      viewer.jar,
    );
    const afterUnfollow = await apiRequest(
      getServer().baseUrl,
      `/api/social/following-status?userIds=${followedId}`,
      {},
      viewer.jar,
    );
    expect((await afterUnfollow.json()) as { followingIds: string[] }).toEqual({
      followingIds: [],
    });
  });

  it("rejects a missing, malformed or oversized id list", async () => {
    const viewer = await signUpTestUser(getServer().baseUrl, "fsbad");
    const tooMany = Array.from({ length: 61 }, (_, index) => `id${index}`).join(",");

    for (const query of ["", "?userIds=", "?userIds=a,b%20c", `?userIds=${tooMany}`]) {
      const response = await apiRequest(
        getServer().baseUrl,
        `/api/social/following-status${query}`,
        {},
        viewer.jar,
      );
      expect(response.status).toBe(400);
    }
  });
});
