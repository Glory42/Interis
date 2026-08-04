import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestMovie } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("diary", () => {
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

  const createEntry = async (
    jar: CookieJar,
    tmdbId: number,
    extra: Record<string, unknown> = {},
  ) => {
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/diary",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId, watchedDate: "2026-01-01", ...extra }),
      },
      jar,
    );
    const body = (await response.json()) as {
      entry: { id: string };
      movie: { id: number; tmdbId: number };
      review: { id: string; content: string } | null;
    };
    return { response, body };
  };

  describe("GET /api/diary", () => {
    it("requires auth", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/diary");
      expect(response.status).toBe(401);
    });

    it("bounds the list with limit/offset instead of returning everything", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "dpage");
      const movies = await Promise.all([
        seedTestMovie("Diary Page Movie 1"),
        seedTestMovie("Diary Page Movie 2"),
        seedTestMovie("Diary Page Movie 3"),
      ]);
      await createEntry(jar, movies[0]!.tmdbId, { watchedDate: "2026-01-01" });
      await createEntry(jar, movies[1]!.tmdbId, { watchedDate: "2026-01-02" });
      await createEntry(jar, movies[2]!.tmdbId, { watchedDate: "2026-01-03" });

      const firstPageResponse = await apiRequest(
        getServer().baseUrl,
        "/api/diary?limit=2",
        {},
        jar,
      );
      const firstPage = (await firstPageResponse.json()) as unknown[];
      expect(firstPage.length).toBe(2);

      const secondPageResponse = await apiRequest(
        getServer().baseUrl,
        "/api/diary?limit=2&offset=2",
        {},
        jar,
      );
      const secondPage = (await secondPageResponse.json()) as unknown[];
      expect(secondPage.length).toBe(1);
    });

    it("falls back to the default bound on an out-of-range limit instead of erroring", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "dbadlimit");
      const movie = await seedTestMovie("Diary Bad Limit Movie");
      await createEntry(jar, movie.tmdbId);

      // DiaryQuerySchema caps limit at 2000 — an out-of-range value should
      // fail schema validation and fall back to the default bound rather
      // than 400ing or silently returning everything.
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/diary?limit=999999",
        {},
        jar,
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as unknown[];
      expect(body.length).toBe(1);
    });
  });

  describe("POST /api/diary (create)", () => {
    it("requires auth", async () => {
      const movie = await seedTestMovie();
      const response = await apiRequest(getServer().baseUrl, "/api/diary", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId: movie.tmdbId, watchedDate: "2026-01-01" }),
      });
      expect(response.status).toBe(401);
    });

    it("rejects an invalid rating step", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "dcbadrate");
      const movie = await seedTestMovie();
      const { response } = await createEntry(jar, movie.tmdbId, { rating: 3.3 });
      expect(response.status).toBe(400);
    });

    it("creates an entry, marks the movie watched, and links an inline review", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "dccreate");
      const movie = await seedTestMovie("Diary Create Movie");

      const { response, body } = await createEntry(jar, movie.tmdbId, {
        rating: 8.5,
        review: "Loved it",
        containsSpoilers: false,
      });
      expect(response.status).toBe(201);
      expect(body.movie.tmdbId).toBe(movie.tmdbId);
      expect(body.review?.content).toBe("Loved it");

      const interactionResponse = await apiRequest(
        getServer().baseUrl,
        `/api/interactions/${movie.tmdbId}`,
        {},
        jar,
      );
      const interaction = (await interactionResponse.json()) as { watched: boolean };
      expect(interaction.watched).toBe(true);

      const listResponse = await apiRequest(getServer().baseUrl, "/api/diary", {}, jar);
      const list = (await listResponse.json()) as Array<{ id: string; review: unknown }>;
      expect(list.some((e) => e.id === body.entry.id)).toBe(true);
    });

    it("does not create a review when no review text is provided", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "dcnoreview");
      const movie = await seedTestMovie("Diary No Review Movie");

      const { body } = await createEntry(jar, movie.tmdbId);
      expect(body.review).toBeNull();
    });
  });

  describe("PUT/DELETE /api/diary/:id (ownership)", () => {
    it("hides existence of another user's entry on update/delete (404, not 403)", async () => {
      const owner = await signUpTestUser(getServer().baseUrl, "downer1");
      const intruder = await signUpTestUser(getServer().baseUrl, "dintr1");
      const movie = await seedTestMovie();
      const { body } = await createEntry(owner.jar, movie.tmdbId);

      const forbiddenUpdate = await apiRequest(
        getServer().baseUrl,
        `/api/diary/${body.entry.id}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ rating: 5 }),
        },
        intruder.jar,
      );
      expect(forbiddenUpdate.status).toBe(404);

      const forbiddenDelete = await apiRequest(
        getServer().baseUrl,
        `/api/diary/${body.entry.id}`,
        { method: "DELETE" },
        intruder.jar,
      );
      expect(forbiddenDelete.status).toBe(404);
    });

    it("allows the owner to update and delete their entry", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "downer2");
      const movie = await seedTestMovie();
      const { body } = await createEntry(jar, movie.tmdbId, { rating: 6 });

      const updateResponse = await apiRequest(
        getServer().baseUrl,
        `/api/diary/${body.entry.id}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ rating: 9, rewatch: true }),
        },
        jar,
      );
      expect(updateResponse.status).toBe(200);
      const updated = (await updateResponse.json()) as { rating: number; rewatch: boolean };
      expect(updated.rating).toBe(9);
      expect(updated.rewatch).toBe(true);

      const deleteResponse = await apiRequest(
        getServer().baseUrl,
        `/api/diary/${body.entry.id}`,
        { method: "DELETE" },
        jar,
      );
      expect(deleteResponse.status).toBe(200);

      const listResponse = await apiRequest(getServer().baseUrl, "/api/diary", {}, jar);
      const list = (await listResponse.json()) as Array<{ id: string }>;
      expect(list.some((e) => e.id === body.entry.id)).toBe(false);
    });

    it("returns 404 when updating/deleting an entry that doesn't exist", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "dghost");
      const missingId = "00000000-0000-0000-0000-000000000000";

      const updateResponse = await apiRequest(
        getServer().baseUrl,
        `/api/diary/${missingId}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ rating: 5 }),
        },
        jar,
      );
      expect(updateResponse.status).toBe(404);

      const deleteResponse = await apiRequest(
        getServer().baseUrl,
        `/api/diary/${missingId}`,
        { method: "DELETE" },
        jar,
      );
      expect(deleteResponse.status).toBe(404);
    });
  });
});
