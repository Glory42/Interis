import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestMovie } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("social feed and activity likes", () => {
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

  const createPost = async (jar: Awaited<ReturnType<typeof signUpTestUser>>["jar"], content: string) => {
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/posts",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      },
      jar,
    );
    return (await response.json()) as { id: string };
  };

  const fetchOwnFeedActivityId = async (jar: Awaited<ReturnType<typeof signUpTestUser>>["jar"]) => {
    const response = await apiRequest(getServer().baseUrl, "/api/social/feed", {}, jar);
    const body = (await response.json()) as { items: Array<{ id: string }> };
    return body.items[0]!.id;
  };

  describe("activity likes", () => {
    it("requires auth to like or unlike", async () => {
      const author = await signUpTestUser(getServer().baseUrl, "salikeauthor");
      await createPost(author.jar, "Likeable activity");
      const activityId = await fetchOwnFeedActivityId(author.jar);

      const likeResponse = await apiRequest(
        getServer().baseUrl,
        `/api/social/activities/${activityId}/like`,
        { method: "POST" },
      );
      expect(likeResponse.status).toBe(401);

      const unlikeResponse = await apiRequest(
        getServer().baseUrl,
        `/api/social/activities/${activityId}/like`,
        { method: "DELETE" },
      );
      expect(unlikeResponse.status).toBe(401);
    });

    it("returns 404 liking a non-existent activity", async () => {
      const { jar } = await signUpTestUser(getServer().baseUrl, "saghost");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/social/activities/00000000-0000-0000-0000-000000000000/like",
        { method: "POST" },
        jar,
      );
      expect(response.status).toBe(404);
    });

    it("likes an activity, is idempotent, then unlikes it", async () => {
      const author = await signUpTestUser(getServer().baseUrl, "saliker-author");
      const liker = await signUpTestUser(getServer().baseUrl, "saliker");
      await createPost(author.jar, "Another likeable activity");
      const activityId = await fetchOwnFeedActivityId(author.jar);

      const firstLike = await apiRequest(
        getServer().baseUrl,
        `/api/social/activities/${activityId}/like`,
        { method: "POST" },
        liker.jar,
      );
      expect(firstLike.status).toBe(200);

      const secondLike = await apiRequest(
        getServer().baseUrl,
        `/api/social/activities/${activityId}/like`,
        { method: "POST" },
        liker.jar,
      );
      expect(secondLike.status).toBe(200);

      const unlikeResponse = await apiRequest(
        getServer().baseUrl,
        `/api/social/activities/${activityId}/like`,
        { method: "DELETE" },
        liker.jar,
      );
      expect(unlikeResponse.status).toBe(200);
    });
  });

  describe("GET /api/social/feed/following", () => {
    it("requires auth", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/social/feed/following");
      expect(response.status).toBe(401);
    });

    it("only includes activity from followed users, not strangers", async () => {
      const viewer = await signUpTestUser(getServer().baseUrl, "sffeedviewer");
      const followed = await signUpTestUser(getServer().baseUrl, "sffeedfollowed");
      const stranger = await signUpTestUser(getServer().baseUrl, "sffeedstranger");

      await apiRequest(
        getServer().baseUrl,
        `/api/social/follow/${followed.username}`,
        { method: "POST" },
        viewer.jar,
      );
      await createPost(followed.jar, "Followed user's post");
      await createPost(stranger.jar, "Stranger's post");

      const response = await apiRequest(
        getServer().baseUrl,
        "/api/social/feed/following",
        {},
        viewer.jar,
      );
      expect(response.status).toBe(200);
      const body = (await response.json()) as {
        items: Array<{ actor: { username: string } }>;
      };
      expect(body.items.some((i) => i.actor.username === followed.username)).toBe(true);
      expect(body.items.some((i) => i.actor.username === stranger.username)).toBe(false);
    });

    it("excludes activity from a user the viewer has blocked, even if still followed", async () => {
      const viewer = await signUpTestUser(getServer().baseUrl, "sfblockviewer");
      const target = await signUpTestUser(getServer().baseUrl, "sfblocktarget");

      await apiRequest(
        getServer().baseUrl,
        `/api/social/follow/${target.username}`,
        { method: "POST" },
        viewer.jar,
      );
      await createPost(target.jar, "Pre-block post");
      await apiRequest(
        getServer().baseUrl,
        `/api/moderation/block/${target.username}`,
        { method: "POST" },
        viewer.jar,
      );

      const response = await apiRequest(
        getServer().baseUrl,
        "/api/social/feed/following",
        {},
        viewer.jar,
      );
      const body = (await response.json()) as {
        items: Array<{ actor: { username: string } }>;
      };
      expect(body.items.some((i) => i.actor.username === target.username)).toBe(false);
    });

    it("excludes activity from a user the viewer has muted", async () => {
      const viewer = await signUpTestUser(getServer().baseUrl, "sfmuteviewer");
      const target = await signUpTestUser(getServer().baseUrl, "sfmutetarget");

      await apiRequest(
        getServer().baseUrl,
        `/api/social/follow/${target.username}`,
        { method: "POST" },
        viewer.jar,
      );
      await createPost(target.jar, "Pre-mute post");
      await apiRequest(
        getServer().baseUrl,
        `/api/moderation/mute/${target.username}`,
        { method: "POST" },
        viewer.jar,
      );

      const response = await apiRequest(
        getServer().baseUrl,
        "/api/social/feed/following",
        {},
        viewer.jar,
      );
      const body = (await response.json()) as {
        items: Array<{ actor: { username: string } }>;
      };
      expect(body.items.some((i) => i.actor.username === target.username)).toBe(false);
    });

    it("paginates with a cursor that advances without repeating items", async () => {
      const viewer = await signUpTestUser(getServer().baseUrl, "sfpageviewer");
      const followed = await signUpTestUser(getServer().baseUrl, "sfpagefollowed");

      await apiRequest(
        getServer().baseUrl,
        `/api/social/follow/${followed.username}`,
        { method: "POST" },
        viewer.jar,
      );
      await createPost(followed.jar, "Page post 1");
      await createPost(followed.jar, "Page post 2");
      await createPost(followed.jar, "Page post 3");

      const firstPageResponse = await apiRequest(
        getServer().baseUrl,
        "/api/social/feed/following?limit=1",
        {},
        viewer.jar,
      );
      const firstPage = (await firstPageResponse.json()) as {
        items: Array<{ id: string }>;
        nextCursor: string | null;
      };
      // getFollowingFeedUncached's unfiltered branch fetches `limit * 2`
      // rows as headroom for the dedup step, but must still only return
      // `limit` items to the caller.
      expect(firstPage.items.length).toBe(1);
      expect(firstPage.nextCursor).not.toBeNull();

      const secondPageResponse = await apiRequest(
        getServer().baseUrl,
        `/api/social/feed/following?limit=1&cursor=${encodeURIComponent(firstPage.nextCursor!)}`,
        {},
        viewer.jar,
      );
      const secondPage = (await secondPageResponse.json()) as {
        items: Array<{ id: string }>;
        nextCursor: string | null;
      };
      expect(secondPage.items.length).toBe(1);

      const thirdPageResponse = await apiRequest(
        getServer().baseUrl,
        `/api/social/feed/following?limit=1&cursor=${encodeURIComponent(secondPage.nextCursor!)}`,
        {},
        viewer.jar,
      );
      const thirdPage = (await thirdPageResponse.json()) as {
        items: Array<{ id: string }>;
        nextCursor: string | null;
      };
      expect(thirdPage.items.length).toBe(1);

      // 3 posts plus the viewer's own "followed_user" activity (a user's
      // own following feed includes their own activity, see
      // getFeedUserIds) = 4 total, one per page across 4 pages.
      const fourthPageResponse = await apiRequest(
        getServer().baseUrl,
        `/api/social/feed/following?limit=1&cursor=${encodeURIComponent(thirdPage.nextCursor!)}`,
        {},
        viewer.jar,
      );
      const fourthPage = (await fourthPageResponse.json()) as {
        items: Array<{ id: string }>;
        nextCursor: string | null;
      };
      expect(fourthPage.items.length).toBe(1);

      const allIds = [firstPage, secondPage, thirdPage, fourthPage].flatMap((page) =>
        page.items.map((i) => i.id),
      );
      expect(new Set(allIds).size).toBe(4);

      // Exhausted the feed - the fourth page must be the end.
      expect(fourthPage.nextCursor).toBeNull();
    });

    it("returns no more than the requested limit even when dedup would otherwise inflate the page", async () => {
      const viewer = await signUpTestUser(getServer().baseUrl, "sfdedupviewer");
      const followed = await signUpTestUser(getServer().baseUrl, "sfdedupfollowed");
      const movie = await seedTestMovie("Feed Dedupe Movie");

      await apiRequest(
        getServer().baseUrl,
        `/api/social/follow/${followed.username}`,
        { method: "POST" },
        viewer.jar,
      );

      // A diary entry with an inline review produces two activity rows
      // (diary_entry + review) that dedupeReviewFeedItems collapses into
      // one feed item - exercising the exact case the fetchLimit
      // over-fetch/dedup/slice logic needs to get right.
      await apiRequest(
        getServer().baseUrl,
        "/api/diary",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            tmdbId: movie.tmdbId,
            watchedDate: "2026-01-01",
            review: "Dedup test review",
          }),
        },
        followed.jar,
      );
      await createPost(followed.jar, "Second activity for dedupe test");

      const response = await apiRequest(
        getServer().baseUrl,
        "/api/social/feed/following?limit=2",
        {},
        viewer.jar,
      );
      const body = (await response.json()) as { items: Array<{ id: string }> };
      expect(body.items.length).toBe(2);
    });
  });
});
