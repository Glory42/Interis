import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { createCookieJar } from "../../support/app/cookie-jar";
import { apiRequest } from "../../support/app/http-client";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";
import { buildAuthCredentials } from "../../support/factories/auth.factory";

describe("auth session lifecycle", () => {
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

  it("returns 401 for /api/users/me without a session", async () => {
    const response = await apiRequest(getServer().baseUrl, "/api/users/me");
    expect(response.status).toBe(401);
  });

  it("rejects reserved usernames during sign-up", async () => {
    const response = await apiRequest(getServer().baseUrl, "/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: "anonymous",
        email: `reserved-${Date.now()}@example.com`,
        password: "password1234",
      }),
    });

    expect(response.status).toBe(400);
  });

  it("keeps auth valid with duplicate access-token cookies and clears on sign-out", async () => {
    const credentials = buildAuthCredentials("auth");
    const jar = createCookieJar();

    const signUpResponse = await apiRequest(
      getServer().baseUrl,
      "/api/auth/sign-up/email",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(credentials),
      },
      jar,
    );
    expect(signUpResponse.ok).toBe(true);

    const initialMeResponse = await apiRequest(getServer().baseUrl, "/api/users/me", {}, jar);
    expect(initialMeResponse.status).toBe(200);

    const accessCookieName = "interis_access_token";
    const staleToken = jar.get(accessCookieName);
    if (!staleToken) {
      throw new Error("Access token cookie not found");
    }

    const signInResponse = await apiRequest(
      getServer().baseUrl,
      "/api/auth/sign-in/email",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      },
      jar,
    );
    expect(signInResponse.ok).toBe(true);

    const freshToken = jar.get(accessCookieName);
    if (!freshToken) {
      throw new Error("Fresh access token cookie not found");
    }
    expect(freshToken).not.toBe(staleToken);

    // A duplicate Cookie header (same name twice) should resolve to the last
    // occurrence — matches parseCookie's precedence.
    const duplicateCookieHeader = `${accessCookieName}=garbage; ${accessCookieName}=${freshToken}`;
    const duplicateCookieResponse = await apiRequest(getServer().baseUrl, "/api/users/me", {
      headers: {
        cookie: duplicateCookieHeader,
      },
    });
    expect(duplicateCookieResponse.status).toBe(200);

    const signOutResponse = await apiRequest(
      getServer().baseUrl,
      "/api/auth/sign-out",
      { method: "POST" },
      jar,
    );
    expect(signOutResponse.ok).toBe(true);

    const postSignOutMeResponse = await apiRequest(
      getServer().baseUrl,
      "/api/users/me",
      {},
      jar,
    );
    expect(postSignOutMeResponse.status).toBe(401);
  });
});
