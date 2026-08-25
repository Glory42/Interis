import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("block and mute", () => {
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

  it("requires auth to block a user", async () => {
    const response = await apiRequest(getServer().baseUrl, "/api/moderation/block/nobody", {
      method: "POST",
    });
    expect(response.status).toBe(401);
  });

  it("rejects blocking yourself", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "self");

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/moderation/block/${username}`,
      { method: "POST" },
      jar,
    );
    expect(response.status).toBe(400);
  });

  it("404s when blocking a user that doesn't exist", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "blkr");

    const response = await apiRequest(
      getServer().baseUrl,
      "/api/moderation/block/does-not-exist",
      { method: "POST" },
      jar,
    );
    expect(response.status).toBe(404);
  });

  it("blocking severs an existing follow relationship in both directions and prevents re-following", async () => {
    const a = await signUpTestUser(getServer().baseUrl, "blka");
    const b = await signUpTestUser(getServer().baseUrl, "blkb");

    // a follows b, b follows a
    await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${b.username}`,
      { method: "POST" },
      a.jar,
    );
    await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${a.username}`,
      { method: "POST" },
      b.jar,
    );

    const isFollowingBefore = await apiRequest(
      getServer().baseUrl,
      `/api/social/is-following/${b.username}`,
      {},
      a.jar,
    );
    expect((await isFollowingBefore.json()) as { isFollowing: boolean }).toEqual({
      isFollowing: true,
    });

    const blockResponse = await apiRequest(
      getServer().baseUrl,
      `/api/moderation/block/${b.username}`,
      { method: "POST" },
      a.jar,
    );
    expect(blockResponse.status).toBe(200);

    const isFollowingAfter = await apiRequest(
      getServer().baseUrl,
      `/api/social/is-following/${b.username}`,
      {},
      a.jar,
    );
    expect((await isFollowingAfter.json()) as { isFollowing: boolean }).toEqual({
      isFollowing: false,
    });

    // b can no longer follow a either (blocked in either direction)
    const reFollow = await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${a.username}`,
      { method: "POST" },
      b.jar,
    );
    const reFollowBody = (await reFollow.json()) as { error: { message: string } };
    expect(reFollowBody.error.message).toBe("Cannot follow this user");
  });

  it("reflects relationship state and unblocks", async () => {
    const a = await signUpTestUser(getServer().baseUrl, "sta");
    const b = await signUpTestUser(getServer().baseUrl, "stb");

    await apiRequest(
      getServer().baseUrl,
      `/api/moderation/block/${b.username}`,
      { method: "POST" },
      a.jar,
    );

    const stateResponse = await apiRequest(
      getServer().baseUrl,
      `/api/moderation/state/${b.username}`,
      {},
      a.jar,
    );
    expect((await stateResponse.json()) as { isBlocked: boolean; isMuted: boolean }).toEqual({
      isBlocked: true,
      isMuted: false,
    });

    const listResponse = await apiRequest(
      getServer().baseUrl,
      "/api/moderation/blocked",
      {},
      a.jar,
    );
    const blockedList = (await listResponse.json()) as { username: string }[];
    expect(blockedList.map((entry) => entry.username)).toContain(b.username);

    const unblockResponse = await apiRequest(
      getServer().baseUrl,
      `/api/moderation/block/${b.username}`,
      { method: "DELETE" },
      a.jar,
    );
    expect(unblockResponse.status).toBe(200);

    const stateAfterUnblock = await apiRequest(
      getServer().baseUrl,
      `/api/moderation/state/${b.username}`,
      {},
      a.jar,
    );
    expect(
      (await stateAfterUnblock.json()) as { isBlocked: boolean; isMuted: boolean },
    ).toEqual({ isBlocked: false, isMuted: false });
  });

  it("mutes a user without affecting the follow relationship", async () => {
    const a = await signUpTestUser(getServer().baseUrl, "mua");
    const b = await signUpTestUser(getServer().baseUrl, "mub");

    await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${b.username}`,
      { method: "POST" },
      a.jar,
    );

    const muteResponse = await apiRequest(
      getServer().baseUrl,
      `/api/moderation/mute/${b.username}`,
      { method: "POST" },
      a.jar,
    );
    expect(muteResponse.status).toBe(200);

    const isFollowingAfterMute = await apiRequest(
      getServer().baseUrl,
      `/api/social/is-following/${b.username}`,
      {},
      a.jar,
    );
    expect(
      (await isFollowingAfterMute.json()) as { isFollowing: boolean },
    ).toEqual({ isFollowing: true });

    const mutedList = await apiRequest(getServer().baseUrl, "/api/moderation/muted", {}, a.jar);
    const mutedNames = ((await mutedList.json()) as { username: string }[]).map(
      (entry) => entry.username,
    );
    expect(mutedNames).toContain(b.username);

    const unmuteResponse = await apiRequest(
      getServer().baseUrl,
      `/api/moderation/mute/${b.username}`,
      { method: "DELETE" },
      a.jar,
    );
    expect(unmuteResponse.status).toBe(200);
  });
});
