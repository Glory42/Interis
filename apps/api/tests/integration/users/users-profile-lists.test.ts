import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestMovie } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("users profile-list endpoints", () => {
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

  const unknownUsername = "no-such-profile-user-xyz";
  const endpoints = ["reviews", "likes", "liked-reviews", "liked-lists", "watchlist"];

  it("returns 404 for each profile-list endpoint on an unknown username", async () => {
    for (const endpoint of endpoints) {
      const response = await apiRequest(
        getServer().baseUrl,
        `/api/users/${unknownUsername}/${endpoint}`,
      );
      expect(response.status).toBe(404);
    }
  });

  it("bounds the likes list with limit/offset instead of returning everything", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "upllikes");
    const movies = await Promise.all([seedTestMovie(), seedTestMovie(), seedTestMovie()]);
    for (const movie of movies) {
      await apiRequest(
        getServer().baseUrl,
        `/api/interactions/${movie.tmdbId}`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ liked: true }),
        },
        jar,
      );
    }

    const firstPageResponse = await apiRequest(
      getServer().baseUrl,
      `/api/users/${username}/likes?limit=2`,
    );
    const firstPage = (await firstPageResponse.json()) as unknown[];
    expect(firstPage.length).toBe(2);

    const secondPageResponse = await apiRequest(
      getServer().baseUrl,
      `/api/users/${username}/likes?limit=2&offset=2`,
    );
    const secondPage = (await secondPageResponse.json()) as unknown[];
    expect(secondPage.length).toBe(1);
  });

  it("surfaces a liked movie under likes and a watchlisted movie under watchlist", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "uplinter");
    const liked = await seedTestMovie();
    const watchlisted = await seedTestMovie();

    await apiRequest(
      getServer().baseUrl,
      `/api/interactions/${liked.tmdbId}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ liked: true }),
      },
      jar,
    );
    await apiRequest(
      getServer().baseUrl,
      `/api/interactions/${watchlisted.tmdbId}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watchlisted: true }),
      },
      jar,
    );

    const likesResponse = await apiRequest(getServer().baseUrl, `/api/users/${username}/likes`);
    const likes = (await likesResponse.json()) as Array<{ tmdbId: number }>;
    expect(likes.some((m) => m.tmdbId === liked.tmdbId)).toBe(true);

    const watchlistResponse = await apiRequest(
      getServer().baseUrl,
      `/api/users/${username}/watchlist`,
    );
    const watchlist = (await watchlistResponse.json()) as Array<{ tmdbId: number }>;
    expect(watchlist.some((m) => m.tmdbId === watchlisted.tmdbId)).toBe(true);
  });

  it("surfaces a review under reviews and its detail via reviews/:reviewId", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "upreview");
    const movie = await seedTestMovie();

    const createResponse = await apiRequest(
      getServer().baseUrl,
      "/api/reviews",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId: movie.tmdbId, content: "Profile review content" }),
      },
      jar,
    );
    const created = (await createResponse.json()) as { review: { id: string } };

    const listResponse = await apiRequest(getServer().baseUrl, `/api/users/${username}/reviews`);
    const list = (await listResponse.json()) as Array<{ id: string }>;
    expect(list.some((r) => r.id === created.review.id)).toBe(true);

    const detailResponse = await apiRequest(
      getServer().baseUrl,
      `/api/users/${username}/reviews/${created.review.id}`,
    );
    expect(detailResponse.status).toBe(200);
  });

  it("returns 404 for a review detail id that doesn't belong to the user", async () => {
    const { username } = await signUpTestUser(getServer().baseUrl, "upreviewghost");
    const response = await apiRequest(
      getServer().baseUrl,
      `/api/users/${username}/reviews/00000000-0000-0000-0000-000000000000`,
    );
    expect(response.status).toBe(404);
  });

  it("surfaces a liked review under liked-reviews and a liked list under liked-lists", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "upliauthor");
    const liker = await signUpTestUser(getServer().baseUrl, "upliker");
    const movie = await seedTestMovie();

    const reviewResponse = await apiRequest(
      getServer().baseUrl,
      "/api/reviews",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId: movie.tmdbId, content: "Likeable review" }),
      },
      author.jar,
    );
    const review = (await reviewResponse.json()) as { review: { id: string } };
    await apiRequest(
      getServer().baseUrl,
      `/api/reviews/${review.review.id}/like`,
      { method: "POST" },
      liker.jar,
    );

    const listCreateResponse = await apiRequest(
      getServer().baseUrl,
      "/api/lists",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Likeable list" }),
      },
      author.jar,
    );
    const list = (await listCreateResponse.json()) as { id: string };
    await apiRequest(
      getServer().baseUrl,
      `/api/lists/${list.id}/like`,
      { method: "POST" },
      liker.jar,
    );

    const likedReviewsResponse = await apiRequest(
      getServer().baseUrl,
      `/api/users/${liker.username}/liked-reviews`,
    );
    const likedReviews = (await likedReviewsResponse.json()) as Array<{ id: string }>;
    expect(likedReviews.some((r) => r.id === review.review.id)).toBe(true);

    const likedListsResponse = await apiRequest(
      getServer().baseUrl,
      `/api/users/${liker.username}/liked-lists`,
    );
    const likedLists = (await likedListsResponse.json()) as Array<{ id: string }>;
    expect(likedLists.some((l) => l.id === list.id)).toBe(true);
  });

  it("searches users by query", async () => {
    const { username } = await signUpTestUser(getServer().baseUrl, "upsearchtarget");

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/users?query=${username}`,
    );
    expect(response.status).toBe(200);
    const results = (await response.json()) as Array<{ username: string }>;
    expect(results.some((u) => u.username === username)).toBe(true);
  });

  it("returns network stats without auth", async () => {
    const response = await apiRequest(getServer().baseUrl, "/api/users/stats/network");
    expect(response.status).toBe(200);
  });
});
