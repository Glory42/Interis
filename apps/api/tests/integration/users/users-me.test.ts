import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestMovie } from "../../support/factories/media.factory";
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

    it("sums up your last seven days of watching", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "umeweek");
      const [first, second, old] = await Promise.all([
        seedTestMovie("Week One"),
        seedTestMovie("Week Two"),
        seedTestMovie("Month Ago"),
      ]);
      const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
      const log = (tmdbId: number, watchedDate: string, rating: number) =>
        apiRequest(
          getServer().baseUrl,
          "/api/diary",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ tmdbId, watchedDate, rating }),
          },
          jar,
        );
      for (const response of await Promise.all([
        log(first.tmdbId, daysAgo(0), 8),
        log(second.tmdbId, daysAgo(3), 9),
        log(old.tmdbId, daysAgo(30), 2),
      ])) {
        expect(response.ok).toBe(true);
      }

      const response = await apiRequest(getServer().baseUrl, "/api/users/me/summary", {}, jar);
      const body = (await response.json()) as { week: { logs: number; averageRating: number | null; episodes: number } };
      expect(body.week).toEqual({ logs: 2, averageRating: 8.5, episodes: 0 });
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

    it("saves Nitrate and moves a stale Tokyo Night id to it", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "umenitrate");
      const putTheme = async (themeId: string) => {
        const response = await apiRequest(
          getServer().baseUrl,
          "/api/users/me/theme",
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ themeId }),
          },
          jar,
        );
        expect(response.status).toBe(200);
        return ((await response.json()) as { themeId: string }).themeId;
      };

      expect(await putTheme("nitrate")).toBe("nitrate");
      expect(await putTheme("tokyo-night")).toBe("nitrate");
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
