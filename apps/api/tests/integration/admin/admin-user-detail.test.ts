import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { promoteToAdmin } from "../../support/factories/admin.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

type ListedUser = { username: string };
type UserDetail = {
  user: { username: string; email: string; isAdmin: boolean; isSuspended: boolean };
  counts: Record<string, number>;
  sessions: Record<string, unknown>[];
};

describe("admin user detail", () => {
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

  const makeAdmin = async (prefix: string) => {
    const admin = await signUpTestUser(getServer().baseUrl, prefix);
    await promoteToAdmin(admin.username);
    return admin;
  };

  const get = (path: string, jar: CookieJar) => apiRequest(getServer().baseUrl, path, {}, jar);
  const post = (path: string, body: unknown, jar: CookieJar) =>
    apiRequest(
      getServer().baseUrl,
      path,
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
      jar,
    );

  const search = async (query: string, jar: CookieJar) => {
    const response = await get(`/api/admin/users?query=${encodeURIComponent(query)}`, jar);
    expect(response.status).toBe(200);
    return ((await response.json()) as ListedUser[]).map((row) => row.username);
  };

  it("finds users by email as well as username", async () => {
    const admin = await makeAdmin("audsearch");
    const target = await signUpTestUser(getServer().baseUrl, "audsearcht");

    expect(await search(target.email, admin.jar)).toContain(target.username);
  });

  it("treats % and _ in a search as literal characters", async () => {
    const admin = await makeAdmin("audwild");
    const target = await signUpTestUser(getServer().baseUrl, "audwildt");

    // As wildcards these would match the "audwil" prefix; as literal text they match nothing.
    const prefix = target.username.slice(0, 6);
    expect(await search(`${prefix.slice(0, 3)}%${prefix.slice(4)}`, admin.jar)).not.toContain(target.username);
    expect(await search(`${prefix.slice(0, 5)}_`, admin.jar)).not.toContain(target.username);
  });

  it("shows a user's account, activity counts and active sessions", async () => {
    const admin = await makeAdmin("auddetail");
    const target = await signUpTestUser(getServer().baseUrl, "auddetailt");

    const response = await get(`/api/admin/users/${target.username}`, admin.jar);
    expect(response.status).toBe(200);
    const detail = (await response.json()) as UserDetail;

    expect(detail.user).toMatchObject({
      username: target.username,
      email: target.email,
      isAdmin: false,
      isSuspended: false,
    });
    expect(detail.counts).toMatchObject({
      movieEntryCount: 0,
      serialEntryCount: 0,
      reviewCount: 0,
      listCount: 0,
      followerCount: 0,
      followingCount: 0,
      reportsFiled: 0,
      reportsAgainst: 0,
    });
    expect(detail.sessions.length).toBeGreaterThanOrEqual(1);
    expect(detail.sessions[0]).toHaveProperty("createdAt");
    expect(detail.sessions[0]).not.toHaveProperty("refreshTokenHash");
    expect(detail.sessions[0]).not.toHaveProperty("previousRefreshTokenHash");
  });

  it("404s for an unknown user and 403s for members", async () => {
    const admin = await makeAdmin("aud404");
    const member = await signUpTestUser(getServer().baseUrl, "aud403");

    expect((await get("/api/admin/users/no-such-user-xyz", admin.jar)).status).toBe(404);
    expect((await get(`/api/admin/users/${admin.username}`, member.jar)).status).toBe(403);
  });

  it("revokes every session after the admin re-enters their password, and logs it", async () => {
    const admin = await makeAdmin("audrevoke");
    const target = await signUpTestUser(getServer().baseUrl, "audrevoket");
    const path = `/api/admin/users/${target.username}/revoke-sessions`;

    expect((await post(path, {}, admin.jar)).status).toBe(401);
    expect((await get("/api/users/me", target.jar)).status).toBe(200);

    expect((await post(path, { adminPassword: admin.password }, admin.jar)).status).toBe(200);
    expect((await get("/api/users/me", target.jar)).status).toBe(401);

    const detail = (await (await get(`/api/admin/users/${target.username}`, admin.jar)).json()) as UserDetail;
    expect(detail.sessions).toHaveLength(0);

    const audit = (await (await get(`/api/admin/audit?actor=${admin.username}`, admin.jar)).json()) as {
      items: { action: string; targetLabel: string | null }[];
    };
    expect(audit.items[0]).toMatchObject({ action: "user.revoke_sessions", targetLabel: target.username });
  });
});
