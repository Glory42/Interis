import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("users /me", () => {
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

  describe("GET /api/users/me", () => {
    it("requires auth", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/users/me");
      expect(response.status).toBe(401);
    });

    it("returns the authenticated user's own profile", async () => {
      const { jar, username } = await signUpTestUser(getServer().baseUrl, "umeself");
      const response = await apiRequest(getServer().baseUrl, "/api/users/me", {}, jar);
      expect(response.status).toBe(200);
      const body = (await response.json()) as { username: string };
      expect(body.username).toBe(username);
    });
  });

  describe("GET /api/users/me/summary", () => {
    it("requires auth", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/users/me/summary");
      expect(response.status).toBe(401);
    });

    it("returns a summary for the authenticated user", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "umesummary");
      const response = await apiRequest(getServer().baseUrl, "/api/users/me/summary", {}, jar);
      expect(response.status).toBe(200);
    });
  });

  describe("PUT /api/users/me", () => {
    it("requires auth", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/users/me", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ bio: "hi" }),
      });
      expect(response.status).toBe(401);
    });

    it("rejects an invalid favorite genre", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "umebadgenre");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/users/me",
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ favoriteGenres: ["NotARealGenre"] }),
        },
        jar,
      );
      expect(response.status).toBe(400);
    });

    it("rejects duplicate favorite genres", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "umedupgenre");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/users/me",
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ favoriteGenres: ["Action", "Action"] }),
        },
        jar,
      );
      expect(response.status).toBe(400);
    });

    it("updates bio, location, and favorite genres", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "umeupdate");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/users/me",
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            bio: "Cinephile.",
            location: "Istanbul",
            favoriteGenres: ["Action", "Comedy"],
          }),
        },
        jar,
      );
      expect(response.status).toBe(200);
      const updated = (await response.json()) as {
        bio: string;
        location: string;
        favoriteGenres: string[];
      };
      expect(updated.bio).toBe("Cinephile.");
      expect(updated.location).toBe("Istanbul");
      expect(updated.favoriteGenres).toEqual(["Action", "Comedy"]);
    });
  });

  describe("PUT /api/users/me/theme", () => {
    it("requires auth", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/users/me/theme", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ themeId: "rose-pine" }),
      });
      expect(response.status).toBe(401);
    });

    it("rejects an empty theme id but silently normalizes an unknown one to the default", async () => {
      // ThemeIdInputSchema's normalizeThemeId() intentionally falls back to
      // DEFAULT_THEME_ID for any unrecognized value (mirrors how legacy
      // theme ids get migrated) rather than rejecting - only truly empty
      // input fails schema validation.
      const { jar } = await signUpTestUser(getServer().baseUrl, "umebadtheme");

      const emptyResponse = await apiRequest(
        getServer().baseUrl,
        "/api/users/me/theme",
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ themeId: "" }),
        },
        jar,
      );
      expect(emptyResponse.status).toBe(400);

      const unknownResponse = await apiRequest(
        getServer().baseUrl,
        "/api/users/me/theme",
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ themeId: "not-a-real-theme" }),
        },
        jar,
      );
      expect(unknownResponse.status).toBe(200);
      const body = (await unknownResponse.json()) as { themeId: string };
      expect(body.themeId).toBe("rose-pine");
    });

    it("updates the theme", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "umetheme");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/users/me/theme",
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ themeId: "rose-pine" }),
        },
        jar,
      );
      expect(response.status).toBe(200);

      const meResponse = await apiRequest(getServer().baseUrl, "/api/users/me", {}, jar);
      const me = (await meResponse.json()) as { themeId: string };
      expect(me.themeId).toBe("rose-pine");
    });
  });
});
