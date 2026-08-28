import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestMovie } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

type NotificationItem = {
  id: string;
  actorId: string;
  type: string;
  entityId: string;
  isRead: boolean;
};

describe("notifications", () => {
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

  it("requires auth to list notifications", async () => {
    const response = await apiRequest(getServer().baseUrl, "/api/notifications");
    expect(response.status).toBe(401);
  });

  it("notifies on follow and marks it read", async () => {
    const a = await signUpTestUser(getServer().baseUrl, "nota");
    const b = await signUpTestUser(getServer().baseUrl, "notb");

    await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${a.username}`,
      { method: "POST" },
      b.jar,
    );

    const listResponse = await apiRequest(
      getServer().baseUrl,
      "/api/notifications",
      {},
      a.jar,
    );
    const page = (await listResponse.json()) as { items: NotificationItem[] };
    const followNotification = page.items.find((item) => item.type === "follow");
    expect(followNotification).toBeDefined();
    expect(followNotification?.isRead).toBe(false);

    const unreadBefore = await apiRequest(
      getServer().baseUrl,
      "/api/notifications/unread-count",
      {},
      a.jar,
    );
    expect((await unreadBefore.json()) as { count: number }).toEqual({ count: 1 });

    const markReadResponse = await apiRequest(
      getServer().baseUrl,
      `/api/notifications/${followNotification!.id}/read`,
      { method: "POST" },
      a.jar,
    );
    expect(markReadResponse.status).toBe(200);

    const unreadAfter = await apiRequest(
      getServer().baseUrl,
      "/api/notifications/unread-count",
      {},
      a.jar,
    );
    expect((await unreadAfter.json()) as { count: number }).toEqual({ count: 0 });
  });

  it("does not notify on self-follow-adjacent actions (liking your own review)", async () => {
    const owner = await signUpTestUser(getServer().baseUrl, "nsa");
    const movie = await seedTestMovie();

    const createReview = await apiRequest(
      getServer().baseUrl,
      "/api/reviews",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          tmdbId: movie.tmdbId,
          mediaType: "movie",
          content: "Great movie",
        }),
      },
      owner.jar,
    );
    const review = (await createReview.json()) as { review: { id: string } } | { id: string };
    const reviewId = "review" in review ? review.review.id : review.id;

    await apiRequest(
      getServer().baseUrl,
      `/api/reviews/${reviewId}/like`,
      { method: "POST" },
      owner.jar,
    );

    const listResponse = await apiRequest(
      getServer().baseUrl,
      "/api/notifications",
      {},
      owner.jar,
    );
    const page = (await listResponse.json()) as { items: NotificationItem[] };
    expect(page.items.find((item) => item.type === "like_review")).toBeUndefined();
  });

  it("notifies the review author when someone else likes and comments", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "reva");
    const liker = await signUpTestUser(getServer().baseUrl, "revb");
    const movie = await seedTestMovie();

    const createReview = await apiRequest(
      getServer().baseUrl,
      "/api/reviews",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mediaSourceId: String(movie.tmdbId),
          mediaType: "movie",
          content: "Loved it",
        }),
      },
      author.jar,
    );
    const review = (await createReview.json()) as { review: { id: string } } | { id: string };
    const reviewId = "review" in review ? review.review.id : review.id;

    await apiRequest(
      getServer().baseUrl,
      `/api/reviews/${reviewId}/like`,
      { method: "POST" },
      liker.jar,
    );

    await apiRequest(
      getServer().baseUrl,
      `/api/reviews/${reviewId}/comments`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Agreed!" }),
      },
      liker.jar,
    );

    const listResponse = await apiRequest(
      getServer().baseUrl,
      "/api/notifications",
      {},
      author.jar,
    );
    const page = (await listResponse.json()) as { items: NotificationItem[] };
    const types = page.items.map((item) => item.type);
    expect(types).toContain("like_review");
    expect(types).toContain("comment_review");
  });

  it("marks all notifications as read", async () => {
    const a = await signUpTestUser(getServer().baseUrl, "mara");
    const b = await signUpTestUser(getServer().baseUrl, "marb");
    const c = await signUpTestUser(getServer().baseUrl, "marc");

    await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${a.username}`,
      { method: "POST" },
      b.jar,
    );
    await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${a.username}`,
      { method: "POST" },
      c.jar,
    );

    const markAllResponse = await apiRequest(
      getServer().baseUrl,
      "/api/notifications/read-all",
      { method: "POST" },
      a.jar,
    );
    expect(markAllResponse.status).toBe(200);

    const unreadAfter = await apiRequest(
      getServer().baseUrl,
      "/api/notifications/unread-count",
      {},
      a.jar,
    );
    expect((await unreadAfter.json()) as { count: number }).toEqual({ count: 0 });
  });
});
