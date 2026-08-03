import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("social follow graph", () => {
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

  it("requires auth to follow", async () => {
    const { username } = await signUpTestUser(getServer().baseUrl, "sftarget1");
    const response = await apiRequest(getServer().baseUrl, `/api/social/follow/${username}`, {
      method: "POST",
    });
    expect(response.status).toBe(401);
  });

  it("returns 404 following an unknown username", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "sfghost");
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/social/follow/no-such-user-xyz",
      { method: "POST" },
      jar,
    );
    expect(response.status).toBe(404);
  });

  it("rejects following yourself", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "sfself");
    const response = await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${username}`,
      { method: "POST" },
      jar,
    );
    expect(response.status).toBe(400);
  });

  it("follows a user, is idempotent, then unfollows", async () => {
    const follower = await signUpTestUser(getServer().baseUrl, "sffollower");
    const target = await signUpTestUser(getServer().baseUrl, "sftarget2");

    const firstFollow = await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${target.username}`,
      { method: "POST" },
      follower.jar,
    );
    expect(firstFollow.status).toBe(200);

    const secondFollow = await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${target.username}`,
      { method: "POST" },
      follower.jar,
    );
    expect(secondFollow.status).toBe(200);

    const isFollowingResponse = await apiRequest(
      getServer().baseUrl,
      `/api/social/is-following/${target.username}`,
      {},
      follower.jar,
    );
    expect((await isFollowingResponse.json()) as { isFollowing: boolean }).toEqual({
      isFollowing: true,
    });

    const unfollowResponse = await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${target.username}`,
      { method: "DELETE" },
      follower.jar,
    );
    expect(unfollowResponse.status).toBe(200);

    const afterUnfollow = await apiRequest(
      getServer().baseUrl,
      `/api/social/is-following/${target.username}`,
      {},
      follower.jar,
    );
    expect((await afterUnfollow.json()) as { isFollowing: boolean }).toEqual({
      isFollowing: false,
    });
  });

  it("prevents following a user you have blocked", async () => {
    const follower = await signUpTestUser(getServer().baseUrl, "sfblocker");
    const target = await signUpTestUser(getServer().baseUrl, "sfblocked");

    const blockResponse = await apiRequest(
      getServer().baseUrl,
      `/api/moderation/block/${target.username}`,
      { method: "POST" },
      follower.jar,
    );
    expect(blockResponse.status).toBe(200);

    const followResponse = await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${target.username}`,
      { method: "POST" },
      follower.jar,
    );
    expect(followResponse.status).toBe(400);
  });

  it("lets a user remove one of their followers", async () => {
    const follower = await signUpTestUser(getServer().baseUrl, "sfremover");
    const target = await signUpTestUser(getServer().baseUrl, "sfremoved");

    await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${target.username}`,
      { method: "POST" },
      follower.jar,
    );

    const removeResponse = await apiRequest(
      getServer().baseUrl,
      `/api/social/follower/${follower.username}`,
      { method: "DELETE" },
      target.jar,
    );
    expect(removeResponse.status).toBe(200);

    const isFollowingResponse = await apiRequest(
      getServer().baseUrl,
      `/api/social/is-following/${target.username}`,
      {},
      follower.jar,
    );
    expect((await isFollowingResponse.json()) as { isFollowing: boolean }).toEqual({
      isFollowing: false,
    });
  });

  it("lists followers and following publicly, without auth", async () => {
    const follower = await signUpTestUser(getServer().baseUrl, "sflistfollower");
    const target = await signUpTestUser(getServer().baseUrl, "sflisttarget");

    await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${target.username}`,
      { method: "POST" },
      follower.jar,
    );

    const followersResponse = await apiRequest(
      getServer().baseUrl,
      `/api/social/followers/${target.username}`,
    );
    expect(followersResponse.status).toBe(200);
    const followers = (await followersResponse.json()) as Array<{ username: string }>;
    expect(followers.some((f) => f.username === follower.username)).toBe(true);

    const followingResponse = await apiRequest(
      getServer().baseUrl,
      `/api/social/following/${follower.username}`,
    );
    expect(followingResponse.status).toBe(200);
    const following = (await followingResponse.json()) as Array<{ username: string }>;
    expect(following.some((f) => f.username === target.username)).toBe(true);
  });

  it("returns 404 for followers/following of an unknown username", async () => {
    const followersResponse = await apiRequest(
      getServer().baseUrl,
      "/api/social/followers/no-such-user-xyz",
    );
    expect(followersResponse.status).toBe(404);

    const followingResponse = await apiRequest(
      getServer().baseUrl,
      "/api/social/following/no-such-user-xyz",
    );
    expect(followingResponse.status).toBe(404);
  });
});
