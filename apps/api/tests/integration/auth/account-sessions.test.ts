import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { SignJWT } from "jose";
import { db } from "../../../src/infrastructure/database/db";
import { authSessions } from "../../../src/infrastructure/database/auth.entity";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser, type SignedUpTestUser } from "../../support/app/auth-flow";
import { createCookieJar, type CookieJar } from "../../support/app/cookie-jar";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

const ACCESS_COOKIE = "interis_access_token";
const REFRESH_COOKIE = "interis_refresh_token";
const FIREFOX_LINUX = "Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0";
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1";

type SessionItem = {
  id: string;
  deviceLabel: string;
  ipAddressMasked: string | null;
  createdAt: string;
  lastActiveAt: string;
  isCurrent: boolean;
};

describe("account sessions", () => {
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

  const request = (path: string, init: RequestInit, jar?: CookieJar) =>
    apiRequest(getServer().baseUrl, path, init, jar);
  const postJson = (path: string, body: unknown, jar?: CookieJar, userAgent?: string) =>
    request(
      path,
      {
        method: "POST",
        headers: { "content-type": "application/json", ...(userAgent ? { "user-agent": userAgent } : {}) },
        body: JSON.stringify(body),
      },
      jar,
    );

  // Another device: a fresh cookie jar signed in with its own user agent.
  const signInDevice = async (owner: SignedUpTestUser, userAgent = SAFARI_IPHONE) => {
    const jar = createCookieJar();
    const response = await postJson("/api/auth/sign-in/email", { email: owner.email, password: owner.password }, jar, userAgent);
    expect(response.status).toBe(200);
    return jar;
  };

  const listSessions = async (jar: CookieJar) => {
    const response = await request("/api/auth/sessions", {}, jar);
    expect(response.status).toBe(200);
    return (await response.json()) as { sessions: SessionItem[]; hasMore: boolean };
  };

  const currentSessionId = async (jar: CookieJar) =>
    (await listSessions(jar)).sessions.find((session) => session.isCurrent)!.id;

  const revoke = (sessionId: string, jar: CookieJar) =>
    request(`/api/auth/sessions/${sessionId}`, { method: "DELETE" }, jar);

  // Simulates a lapsed access token so the request has to rotate the refresh token.
  const meViaRefreshOnly = async (jar: CookieJar) => {
    const secretKey = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const now = Math.floor(Date.now() / 1000);
    const expired = await new SignJWT({ sid: "expired" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject("expired")
      .setIssuedAt(now - 3600)
      .setExpirationTime(now - 1800)
      .sign(secretKey);
    return request("/api/users/me", {
      headers: { cookie: `${ACCESS_COOKIE}=${expired}; ${REFRESH_COOKIE}=${jar.get(REFRESH_COOKIE)}` },
    });
  };

  it("lists live sessions with the current one first and leaves out revoked and expired ones", async () => {
    const owner = await signUpTestUser(getServer().baseUrl, "sesls");
    const phone = await signInDevice(owner);
    const laptop = await signInDevice(owner, FIREFOX_LINUX);

    const signedOut = await signInDevice(owner);
    expect((await request("/api/auth/sign-out", { method: "POST" }, signedOut)).status).toBe(200);

    const expired = await signInDevice(owner);
    await db
      .update(authSessions)
      .set({ expiresAt: new Date(Date.now() - 60_000) })
      .where(eq(authSessions.id, await currentSessionId(expired)));

    const { sessions, hasMore } = await listSessions(laptop);
    expect(hasMore).toBe(false);
    expect(sessions).toHaveLength(3);
    expect(sessions[0]).toMatchObject({ deviceLabel: "Firefox on Linux", isCurrent: true });
    expect(sessions.filter((session) => session.isCurrent)).toHaveLength(1);
    expect(sessions.map((session) => session.id)).toContain(await currentSessionId(phone));
    expect(sessions.some((session) => session.deviceLabel === "Safari on iPhone")).toBe(true);
    // Loopback is a proxy-ish address, never shown; and no token hashes leave the server.
    expect(sessions[0]!.ipAddressMasked).toBeNull();
    expect(Object.keys(sessions[0]!).sort()).toEqual(
      ["createdAt", "deviceLabel", "id", "ipAddressMasked", "isCurrent", "lastActiveAt"].sort(),
    );
  });

  it("bumps last active when the refresh token rotates", async () => {
    const owner = await signUpTestUser(getServer().baseUrl, "sesact");
    const phone = await signInDevice(owner);
    const phoneId = await currentSessionId(phone);
    const longAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);
    await db.update(authSessions).set({ updatedAt: longAgo }).where(eq(authSessions.id, phoneId));

    expect((await meViaRefreshOnly(phone)).status).toBe(200);

    const { sessions } = await listSessions(owner.jar);
    const lastActiveAt = new Date(sessions.find((session) => session.id === phoneId)!.lastActiveAt);
    expect(lastActiveAt.getTime()).toBeGreaterThan(Date.now() - 60_000);
  });

  it("revokes another session so it can no longer use its access token or refresh", async () => {
    const owner = await signUpTestUser(getServer().baseUrl, "sesrv");
    const phone = await signInDevice(owner);
    const phoneId = await currentSessionId(phone);

    expect((await revoke(phoneId, owner.jar)).status).toBe(200);

    expect((await request("/api/users/me", {}, createJarCopy(phone))).status).toBe(401);
    expect((await meViaRefreshOnly(phone)).status).toBe(401);
    expect((await listSessions(owner.jar)).sessions.map((session) => session.id)).not.toContain(phoneId);
    expect((await revoke(phoneId, owner.jar)).status).toBe(404);
  });

  it("refuses to revoke the current session through this endpoint", async () => {
    const owner = await signUpTestUser(getServer().baseUrl, "sescur");
    const response = await revoke(await currentSessionId(owner.jar), owner.jar);
    expect(response.status).toBe(400);
    expect((await request("/api/users/me", {}, owner.jar)).status).toBe(200);
  });

  it("returns 404 when revoking someone else's session and leaves it signed in", async () => {
    const owner = await signUpTestUser(getServer().baseUrl, "sesown");
    const intruder = await signUpTestUser(getServer().baseUrl, "sesint");
    const ownerSessionId = await currentSessionId(owner.jar);

    expect((await revoke(ownerSessionId, intruder.jar)).status).toBe(404);
    expect((await revoke("no-such-session", intruder.jar)).status).toBe(404);
    expect((await request("/api/users/me", {}, owner.jar)).status).toBe(200);
  });

  it("signs out all other sessions only with the right current password", async () => {
    const owner = await signUpTestUser(getServer().baseUrl, "sesall");
    const phone = await signInDevice(owner);
    const tablet = await signInDevice(owner);

    expect((await postJson("/api/auth/sessions/revoke-others", {}, owner.jar)).status).toBe(400);
    const wrong = await postJson("/api/auth/sessions/revoke-others", { currentPassword: "not-my-password" }, owner.jar);
    expect(wrong.status).toBe(401);
    expect((await listSessions(owner.jar)).sessions).toHaveLength(3);

    const right = await postJson("/api/auth/sessions/revoke-others", { currentPassword: owner.password }, owner.jar);
    expect(right.status).toBe(200);
    expect(await right.json()).toEqual({ revokedCount: 2 });

    const { sessions } = await listSessions(owner.jar);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.isCurrent).toBe(true);
    expect((await meViaRefreshOnly(phone)).status).toBe(401);
    expect((await request("/api/users/me", {}, tablet)).status).toBe(401);
  });

  it("signs out other devices when the password changes, keeping this one", async () => {
    const owner = await signUpTestUser(getServer().baseUrl, "sespw");
    const phone = await signInDevice(owner);

    const changed = await postJson(
      "/api/auth/change-password",
      { currentPassword: owner.password, newPassword: "BrandNewPassword123!" },
      owner.jar,
    );
    expect(changed.status).toBe(200);
    expect((await request("/api/users/me", {}, owner.jar)).status).toBe(200);
    expect((await request("/api/users/me", {}, phone)).status).toBe(401);
    expect((await meViaRefreshOnly(phone)).status).toBe(401);
  });

  it("signs out every device when the password is reset through the recovery question", async () => {
    const owner = await signUpTestUser(getServer().baseUrl, "sesrst");
    const phone = await signInDevice(owner);
    const saved = await postJson("/api/auth/security-question", { question: "First film?", answer: "Alien" }, owner.jar);
    expect(saved.status).toBe(200);

    const reset = await postJson("/api/auth/reset-password", { email: owner.email, answer: "alien", newPassword: "ResetPassword123!" });
    expect(reset.status).toBe(200);
    expect((await request("/api/users/me", {}, owner.jar)).status).toBe(401);
    expect((await meViaRefreshOnly(phone)).status).toBe(401);
  });
});

// The access-token check alone, without the refresh cookie rescuing the request.
const createJarCopy = (jar: CookieJar): CookieJar => {
  const copy = createCookieJar();
  const access = jar.get(ACCESS_COOKIE);
  if (access) copy.set(ACCESS_COOKIE, access);
  return copy;
};
