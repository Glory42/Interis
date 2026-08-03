import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestMovie } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("reviews comments", () => {
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

  const createReview = async (jar: CookieJar, tmdbId: number, content = "Great movie") => {
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/reviews",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId, content }),
      },
      jar,
    );
    const body = (await response.json()) as {
      review: { id: string; content: string };
    };
    return body;
  };

  it("requires auth to add a comment", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "rcommentauth");
    const movie = await seedTestMovie();
    const review = await createReview(jar, movie.tmdbId, "Commentable review");

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/reviews/${review.review.id}/comments`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Nice!" }),
      },
    );
    expect(response.status).toBe(401);
  });

  it("rejects empty comment content", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "rcemptyauthor");
    const movie = await seedTestMovie();
    const review = await createReview(author.jar, movie.tmdbId, "Review for empty comment");

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/reviews/${review.review.id}/comments`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "" }),
      },
      author.jar,
    );
    expect(response.status).toBe(400);
  });

  it("returns 404 when commenting on a non-existent review", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "rcghost");
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/reviews/00000000-0000-0000-0000-000000000000/comments",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Nice!" }),
      },
      jar,
    );
    expect(response.status).toBe(404);
  });

  it("adds a comment and surfaces it via GET /api/reviews/:id/comments", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "rcaddauthor");
    const commenter = await signUpTestUser(getServer().baseUrl, "rcaddcommenter");
    const movie = await seedTestMovie();
    const review = await createReview(author.jar, movie.tmdbId, "Review to comment on");

    const addResponse = await apiRequest(
      getServer().baseUrl,
      `/api/reviews/${review.review.id}/comments`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Great review!" }),
      },
      commenter.jar,
    );
    expect(addResponse.status).toBe(201);
    const added = (await addResponse.json()) as { id: string; content: string };
    expect(added.content).toBe("Great review!");

    const listResponse = await apiRequest(
      getServer().baseUrl,
      `/api/reviews/${review.review.id}/comments`,
    );
    expect(listResponse.status).toBe(200);
    const list = (await listResponse.json()) as Array<{ id: string }>;
    expect(list.some((c) => c.id === added.id)).toBe(true);
  });

  it("scopes comment ownership to the commenter, not the review owner", async () => {
    // The review's owner and the comment's owner are different actors:
    // deleting/updating a comment on your own review must not be allowed
    // just because you own the review — /comments/:commentId ownership is
    // scoped strictly to the comment's own userId.
    const reviewOwner = await signUpTestUser(getServer().baseUrl, "rcownerreview");
    const commenter = await signUpTestUser(getServer().baseUrl, "rcownercomment");
    const movie = await seedTestMovie();
    const review = await createReview(reviewOwner.jar, movie.tmdbId, "Ownership boundary review");

    const addResponse = await apiRequest(
      getServer().baseUrl,
      `/api/reviews/${review.review.id}/comments`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Commenter's own comment" }),
      },
      commenter.jar,
    );
    const comment = (await addResponse.json()) as { id: string };

    const reviewOwnerDeleteAttempt = await apiRequest(
      getServer().baseUrl,
      `/api/reviews/comments/${comment.id}`,
      { method: "DELETE" },
      reviewOwner.jar,
    );
    expect(reviewOwnerDeleteAttempt.status).toBe(404);

    const reviewOwnerUpdateAttempt = await apiRequest(
      getServer().baseUrl,
      `/api/reviews/comments/${comment.id}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Hijacked comment" }),
      },
      reviewOwner.jar,
    );
    expect(reviewOwnerUpdateAttempt.status).toBe(404);

    const commenterUpdate = await apiRequest(
      getServer().baseUrl,
      `/api/reviews/comments/${comment.id}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Edited by rightful owner" }),
      },
      commenter.jar,
    );
    expect(commenterUpdate.status).toBe(200);

    const commenterDelete = await apiRequest(
      getServer().baseUrl,
      `/api/reviews/comments/${comment.id}`,
      { method: "DELETE" },
      commenter.jar,
    );
    expect(commenterDelete.status).toBe(200);

    const listAfterDelete = await apiRequest(
      getServer().baseUrl,
      `/api/reviews/${review.review.id}/comments`,
    );
    const listBody = (await listAfterDelete.json()) as Array<{ id: string }>;
    expect(listBody.some((c) => c.id === comment.id)).toBe(false);
  });
});
