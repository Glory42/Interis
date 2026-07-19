import { SignJWT } from "jose";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createCookieJar } from "../../support/app/cookie-jar";
import { apiRequest } from "../../support/app/http-client";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { buildAuthCredentials } from "../../support/factories/auth.factory";

const ACCESS_COOKIE = "interis_access_token";
const REFRESH_COOKIE = "interis_refresh_token";

describe("session revocation and refresh rotation", () => {
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
    if (!testServer) {
      return;
    }
    await testServer.close();
    testServer = null;
  });

  it("logout revokes the session immediately, not just the cookie", async () => {
    const jar = createCookieJar();
    const auth = buildAuthCredentials("revoke");

    const signUpResponse = await apiRequest(
      getServer().baseUrl,
      "/api/auth/sign-up/email",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(auth),
      },
      jar,
    );
    expect(signUpResponse.ok).toBe(true);

    // Capture the still-valid access token before sign-out clears the jar.
    const capturedAccessToken = jar.get(ACCESS_COOKIE);
    if (!capturedAccessToken) {
      throw new Error("Access token cookie not found after sign-up");
    }

    const signOutResponse = await apiRequest(
      getServer().baseUrl,
      "/api/auth/sign-out",
      { method: "POST" },
      jar,
    );
    expect(signOutResponse.ok).toBe(true);

    // Replay the captured (unexpired) access token directly — the JWT
    // signature and exp are still valid, so only the session-active DB
    // check can catch this.
    const replayResponse = await apiRequest(getServer().baseUrl, "/api/users/me", {
      headers: { cookie: `${ACCESS_COOKIE}=${capturedAccessToken}` },
    });
    expect(replayResponse.status).toBe(401);
  });

  it("transparently rotates an expired access token when the refresh token is valid", async () => {
    const jar = createCookieJar();
    const auth = buildAuthCredentials("rotate");

    const signUpResponse = await apiRequest(
      getServer().baseUrl,
      "/api/auth/sign-up/email",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(auth),
      },
      jar,
    );
    expect(signUpResponse.ok).toBe(true);

    const refreshToken = jar.get(REFRESH_COOKIE);
    if (!refreshToken) {
      throw new Error("Refresh token cookie not found after sign-up");
    }

    // Forge an already-expired access token for the same JWT secret so we
    // don't have to wait out the real 15-minute TTL.
    const secretKey = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const { user } = (await signUpResponse.json()) as { user: { id: string } };
    const expiredAccessToken = await new SignJWT({ sid: "irrelevant-expired-session" })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1800)
      .sign(secretKey);

    const response = await apiRequest(getServer().baseUrl, "/api/users/me", {
      headers: {
        cookie: `${ACCESS_COOKIE}=${expiredAccessToken}; ${REFRESH_COOKIE}=${refreshToken}`,
      },
    });

    expect(response.status).toBe(200);
    const setCookies = response.headers.getSetCookie?.() ?? [];
    expect(setCookies.some((cookie) => cookie.startsWith(`${ACCESS_COOKIE}=`))).toBe(true);
    expect(setCookies.some((cookie) => cookie.startsWith(`${REFRESH_COOKIE}=`))).toBe(true);
  });

  it("rejects a replayed refresh token and kills the whole session", async () => {
    const jar = createCookieJar();
    const auth = buildAuthCredentials("replay");

    const signUpResponse = await apiRequest(
      getServer().baseUrl,
      "/api/auth/sign-up/email",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(auth),
      },
      jar,
    );
    expect(signUpResponse.ok).toBe(true);

    const originalRefreshToken = jar.get(REFRESH_COOKIE);
    if (!originalRefreshToken) {
      throw new Error("Refresh token cookie not found after sign-up");
    }

    const secretKey = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET);
    const { user } = (await signUpResponse.json()) as { user: { id: string } };
    const forgeExpiredAccessToken = () =>
      new SignJWT({ sid: "irrelevant-expired-session" })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(user.id)
        .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
        .setExpirationTime(Math.floor(Date.now() / 1000) - 1800)
        .sign(secretKey);

    // First rotation succeeds and issues a new refresh token.
    const firstRotation = await apiRequest(getServer().baseUrl, "/api/users/me", {
      headers: {
        cookie: `${ACCESS_COOKIE}=${await forgeExpiredAccessToken()}; ${REFRESH_COOKIE}=${originalRefreshToken}`,
      },
    });
    expect(firstRotation.status).toBe(200);
    const rotatedSetCookies = firstRotation.headers.getSetCookie?.() ?? [];
    const rotatedRefreshCookie = rotatedSetCookies.find((cookie) =>
      cookie.startsWith(`${REFRESH_COOKIE}=`),
    );
    if (!rotatedRefreshCookie) {
      throw new Error("Rotated refresh token cookie not found");
    }
    const rotatedRefreshToken = rotatedRefreshCookie.split(";")[0]?.split("=")[1];

    // Replaying the original (now-stale) refresh token should be treated as
    // theft — the whole session gets revoked, including the freshly
    // rotated token.
    const replayResponse = await apiRequest(getServer().baseUrl, "/api/users/me", {
      headers: {
        cookie: `${ACCESS_COOKIE}=${await forgeExpiredAccessToken()}; ${REFRESH_COOKIE}=${originalRefreshToken}`,
      },
    });
    expect(replayResponse.status).toBe(401);

    const rotatedTokenResponse = await apiRequest(getServer().baseUrl, "/api/users/me", {
      headers: {
        cookie: `${ACCESS_COOKIE}=${await forgeExpiredAccessToken()}; ${REFRESH_COOKIE}=${rotatedRefreshToken}`,
      },
    });
    expect(rotatedTokenResponse.status).toBe(401);
  });
});
