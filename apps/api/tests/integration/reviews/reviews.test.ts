import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestMovie, seedTestSerial } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("reviews", () => {
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

  const createReview = async (
    jar: CookieJar,
    tmdbId: number,
    content = "Great movie",
    extra: Record<string, unknown> = {},
  ) => {
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/reviews",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mediaSourceId: String(tmdbId), content, ...extra }),
      },
      jar,
    );
    const body = (await response.json()) as {
      review: { id: string; content: string; movieId: number };
      movie: { tmdbId: number };
    };
    return { response, body };
  };

  describe("POST /api/reviews (create)", () => {
    it("requires auth", async () => {
      const movie = await seedTestMovie();
      const response = await apiRequest(getServer().baseUrl, "/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mediaSourceId: String(movie.tmdbId), content: "hi" }),
      });
      expect(response.status).toBe(401);
    });

    it("rejects empty content", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "rcempty");
      const movie = await seedTestMovie();
      const { response } = await createReview(jar, movie.tmdbId, "");
      expect(response.status).toBe(400);
    });

    it("creates a standalone movie review and surfaces it via GET /api/reviews/:id", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "rccreate");
      const movie = await seedTestMovie("Standalone Review Movie");
      const { response, body } = await createReview(jar, movie.tmdbId, "My honest take");
      expect(response.status).toBe(201);
      expect(body.review.content).toBe("My honest take");
      expect(body.movie.tmdbId).toBe(movie.tmdbId);

      const getResponse = await apiRequest(
        getServer().baseUrl,
        `/api/reviews/${body.review.id}`,
      );
      expect(getResponse.status).toBe(200);
      const fetched = (await getResponse.json()) as {
        review: { id: string; content: string };
        likeCount: number;
      };
      expect(fetched.review.id).toBe(body.review.id);
      expect(fetched.likeCount).toBe(0);
    });

    it("upserts in place when reviewing the same movie twice", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "rcupsert");
      const movie = await seedTestMovie("Upsert Review Movie");
      const { body: first } = await createReview(jar, movie.tmdbId, "First take");
      const { response: secondResponse, body: second } = await createReview(
        jar,
        movie.tmdbId,
        "Revised take",
      );
      expect(secondResponse.status).toBe(201);
      expect(second.review.id).toBe(first.review.id);
      expect(second.review.content).toBe("Revised take");
    });

    it("creates a standalone TV review via the same endpoint", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "rctv");
      const serial = await seedTestSerial("Standalone Review Serial");

      const response = await apiRequest(
        getServer().baseUrl,
        "/api/reviews",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            mediaSourceId: String(serial.tmdbId),
            mediaType: "tv",
            content: "TV take",
          }),
        },
        jar,
      );
      expect(response.status).toBe(201);
      const body = (await response.json()) as {
        review: { id: string; content: string };
        series: { tmdbId: number };
      };
      expect(body.review.content).toBe("TV take");
      expect(body.series.tmdbId).toBe(serial.tmdbId);
    });
  });

  it("returns 404 for a non-existent review", async () => {
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/reviews/00000000-0000-0000-0000-000000000000",
    );
    expect(response.status).toBe(404);
  });

  describe("PUT/DELETE /api/reviews/:id (ownership)", () => {
    it("hides existence of another user's review on update/delete (404, not 403)", async () => {
      const owner = await signUpTestUser(getServer().baseUrl, "rowner1");
      const intruder = await signUpTestUser(getServer().baseUrl, "rintr1");
      const movie = await seedTestMovie();
      const { body: review } = await createReview(owner.jar, movie.tmdbId, "Owned review");

      const forbiddenUpdate = await apiRequest(
        getServer().baseUrl,
        `/api/reviews/${review.review.id}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: "Hijacked" }),
        },
        intruder.jar,
      );
      expect(forbiddenUpdate.status).toBe(404);

      const forbiddenDelete = await apiRequest(
        getServer().baseUrl,
        `/api/reviews/${review.review.id}`,
        { method: "DELETE" },
        intruder.jar,
      );
      expect(forbiddenDelete.status).toBe(404);
    });

    it("allows the owner to update and delete their review", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "rowner2");
      const movie = await seedTestMovie();
      const { body: review } = await createReview(jar, movie.tmdbId, "Editable review");

      const updateResponse = await apiRequest(
        getServer().baseUrl,
        `/api/reviews/${review.review.id}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: "Edited", containsSpoilers: true }),
        },
        jar,
      );
      expect(updateResponse.status).toBe(200);
      const updated = (await updateResponse.json()) as {
        content: string;
        containsSpoilers: boolean;
      };
      expect(updated.content).toBe("Edited");
      expect(updated.containsSpoilers).toBe(true);

      const deleteResponse = await apiRequest(
        getServer().baseUrl,
        `/api/reviews/${review.review.id}`,
        { method: "DELETE" },
        jar,
      );
      expect(deleteResponse.status).toBe(200);

      const afterDelete = await apiRequest(
        getServer().baseUrl,
        `/api/reviews/${review.review.id}`,
      );
      expect(afterDelete.status).toBe(404);
    });
  });

  describe("like/unlike", () => {
    it("requires auth for like and unlike", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "rlikeauth");
      const movie = await seedTestMovie();
      const { body: review } = await createReview(jar, movie.tmdbId, "Likeable review");

      const likeResponse = await apiRequest(
        getServer().baseUrl,
        `/api/reviews/${review.review.id}/like`,
        { method: "POST" },
      );
      expect(likeResponse.status).toBe(401);

      const unlikeResponse = await apiRequest(
        getServer().baseUrl,
        `/api/reviews/${review.review.id}/like`,
        { method: "DELETE" },
      );
      expect(unlikeResponse.status).toBe(401);
    });

    it("likes a review, is idempotent, then unlikes it", async () => {
      const author = await signUpTestUser(getServer().baseUrl, "rlikeauthor");
      const liker = await signUpTestUser(getServer().baseUrl, "rliker");
      const movie = await seedTestMovie();
      const { body: review } = await createReview(author.jar, movie.tmdbId, "Likeable review 2");

      const firstLike = await apiRequest(
        getServer().baseUrl,
        `/api/reviews/${review.review.id}/like`,
        { method: "POST" },
        liker.jar,
      );
      expect(firstLike.status).toBe(200);
      expect(await firstLike.json()).toEqual({ liked: true, alreadyLiked: false });

      const secondLike = await apiRequest(
        getServer().baseUrl,
        `/api/reviews/${review.review.id}/like`,
        { method: "POST" },
        liker.jar,
      );
      expect(secondLike.status).toBe(200);
      expect(await secondLike.json()).toEqual({ liked: true, alreadyLiked: true });

      const detail = await apiRequest(
        getServer().baseUrl,
        `/api/reviews/${review.review.id}`,
      );
      expect((await detail.json() as { likeCount: number }).likeCount).toBe(1);

      const unlikeResponse = await apiRequest(
        getServer().baseUrl,
        `/api/reviews/${review.review.id}/like`,
        { method: "DELETE" },
        liker.jar,
      );
      expect(unlikeResponse.status).toBe(200);

      const afterUnlike = await apiRequest(
        getServer().baseUrl,
        `/api/reviews/${review.review.id}`,
      );
      expect((await afterUnlike.json() as { likeCount: number }).likeCount).toBe(0);
    });

    it("returns 404 when unliking a review that was never liked", async () => {
      const author = await signUpTestUser(getServer().baseUrl, "rnolikeauthor");
      const other = await signUpTestUser(getServer().baseUrl, "rnoliker");
      const movie = await seedTestMovie();
      const { body: review } = await createReview(author.jar, movie.tmdbId, "Never liked");

      const response = await apiRequest(
        getServer().baseUrl,
        `/api/reviews/${review.review.id}/like`,
        { method: "DELETE" },
        other.jar,
      );
      expect(response.status).toBe(404);
    });
  });
});
