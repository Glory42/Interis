import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { buildAuthCredentials } from "../../support/factories/auth.factory";
import { createCookieJar, getSetCookies } from "../../support/app/cookie-jar";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("auth account management", () => {
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

  describe("sign-up/sign-in response shape", () => {
    it("sign-up returns the created user and sets auth cookies", async () => {
      const credentials = buildAuthCredentials("aacsu");
      const jar = createCookieJar();
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/auth/sign-up/email",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(credentials),
        },
        jar,
      );
      expect(response.status).toBe(201);
      const body = (await response.json()) as { user: { username: string; email: string } };
      expect(body.user.username).toBe(credentials.username);
      expect(body.user.email).toBe(credentials.email);
      expect(getSetCookies(response).length).toBeGreaterThanOrEqual(2);
    });

    it("sign-in returns the user and sets auth cookies", async () => {
      const credentials = buildAuthCredentials("aacsi");
      await apiRequest(getServer().baseUrl, "/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const jar = createCookieJar();
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/auth/sign-in/email",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: credentials.email, password: credentials.password }),
        },
        jar,
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as { user: { username: string } };
      expect(body.user.username).toBe(credentials.username);
      expect(getSetCookies(response).length).toBeGreaterThanOrEqual(2);
    });

    it("sign-in rejects the wrong password", async () => {
      const credentials = buildAuthCredentials("aacwrong");
      await apiRequest(getServer().baseUrl, "/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const response = await apiRequest(getServer().baseUrl, "/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: credentials.email, password: "wrong-password" }),
      });
      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/auth/update-user", () => {
    it("requires auth", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/auth/update-user", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "newname" }),
      });
      expect(response.status).toBe(401);
    });

    it("rejects a username already taken by another account", async () => {
      const taken = await signUpTestUser(getServer().baseUrl, "aactaken");
      const { jar } = await signUpTestUser(getServer().baseUrl, "aacwants");

      const response = await apiRequest(
        getServer().baseUrl,
        "/api/auth/update-user",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ username: taken.username }),
        },
        jar,
      );
      expect(response.status).toBe(409);
    });

    it("updates the username", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "aacupdate");
      const newUsername = `aacr_${Date.now().toString(36)}`.slice(0, 20);

      const response = await apiRequest(
        getServer().baseUrl,
        "/api/auth/update-user",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ username: newUsername }),
        },
        jar,
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as { user: { username: string } };
      expect(body.user.username).toBe(newUsername);
    });
  });

  describe("POST /api/auth/change-password", () => {
    it("requires auth", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: "a", newPassword: "b" }),
      });
      expect(response.status).toBe(401);
    });

    it("rejects an incorrect current password", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "aacbadcurrent");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/auth/change-password",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            currentPassword: "not-the-real-password",
            newPassword: "NewSecurePassword123!",
          }),
        },
        jar,
      );
      expect(response.status).toBe(401);
    });

    it("changes the password, invalidating the old one for future sign-ins", async () => {
      const credentials = buildAuthCredentials("aacchange");
      const jar = createCookieJar();
      await apiRequest(
        getServer().baseUrl,
        "/api/auth/sign-up/email",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(credentials),
        },
        jar,
      );

      const changeResponse = await apiRequest(
        getServer().baseUrl,
        "/api/auth/change-password",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            currentPassword: credentials.password,
            newPassword: "BrandNewPassword123!",
          }),
        },
        jar,
      );
      expect(changeResponse.status).toBe(200);

      const oldPasswordSignIn = await apiRequest(getServer().baseUrl, "/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: credentials.email, password: credentials.password }),
      });
      expect(oldPasswordSignIn.status).toBe(401);

      const newPasswordSignIn = await apiRequest(getServer().baseUrl, "/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: credentials.email,
          password: "BrandNewPassword123!",
        }),
      });
      expect(newPasswordSignIn.status).toBe(200);
    });
  });

  describe("DELETE /api/auth/account", () => {
    it("requires auth", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/auth/account", {
        method: "DELETE",
      });
      expect(response.status).toBe(401);
    });

    it("deletes the account, invalidating the session and freeing the username", async () => {
      const { jar, username, email } = await signUpTestUser(getServer().baseUrl, "aacdelete");

      const deleteResponse = await apiRequest(
        getServer().baseUrl,
        "/api/auth/account",
        { method: "DELETE" },
        jar,
      );
      expect(deleteResponse.status).toBe(200);

      const afterDelete = await apiRequest(getServer().baseUrl, "/api/users/me", {}, jar);
      expect(afterDelete.status).toBe(401);

      const reSignUpResponse = await apiRequest(getServer().baseUrl, "/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, email, password: "AnotherPassword123!" }),
      });
      expect(reSignUpResponse.status).toBe(201);
    });
  });
});
