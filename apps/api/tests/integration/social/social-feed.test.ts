import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestFilm } from "../../support/factories/media.factory";
import { activityItems, readFollowingFeed, titleGroups } from "../../support/app/following-feed";
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

  const fetchOwnFeedActivityId = async (jar: Awaited<ReturnType<typeof signUpTestUser>>["jar"]) =>
    activityItems((await readFollowingFeed(getServer().baseUrl, jar)).rows)[0]!.id;

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

  describe("GET /api/social/feed/grouped", () => {
    type Jar = Awaited<ReturnType<typeof signUpTestUser>>["jar"];
    const follow = (jar: Jar, username: string) =>
      apiRequest(getServer().baseUrl, `/api/social/follow/${username}`, { method: "POST" }, jar);
    const feedActors = async (jar: Jar) =>
      (await readFollowingFeed(getServer().baseUrl, jar)).rows.map((row) =>
        row.kind === "activity" ? row.item.actor.username : row.kind === "title" ? row.group.actor.username : row.actor.username,
      );

    it("requires auth", async () => {
      const response = await apiRequest(getServer().baseUrl, "/api/social/feed/grouped");
      expect(response.status).toBe(401);
    });

    it("only includes activity from followed users, not strangers", async () => {
      const viewer = await signUpTestUser(getServer().baseUrl, "sffeedviewer");
      const followed = await signUpTestUser(getServer().baseUrl, "sffeedfollowed");
      const stranger = await signUpTestUser(getServer().baseUrl, "sffeedstranger");

      await follow(viewer.jar, followed.username);
      await createPost(followed.jar, "Followed user's post");
      await createPost(stranger.jar, "Stranger's post");

      const actors = await feedActors(viewer.jar);
      expect(actors).toContain(followed.username);
      expect(actors).not.toContain(stranger.username);
    });

    it("excludes activity from a user the viewer has blocked, even if still followed", async () => {
      const viewer = await signUpTestUser(getServer().baseUrl, "sfblockviewer");
      const target = await signUpTestUser(getServer().baseUrl, "sfblocktarget");

      await follow(viewer.jar, target.username);
      await createPost(target.jar, "Pre-block post");
      await apiRequest(getServer().baseUrl, `/api/moderation/block/${target.username}`, { method: "POST" }, viewer.jar);

      expect(await feedActors(viewer.jar)).not.toContain(target.username);
    });

    it("excludes activity from a user the viewer has muted", async () => {
      const viewer = await signUpTestUser(getServer().baseUrl, "sfmuteviewer");
      const target = await signUpTestUser(getServer().baseUrl, "sfmutetarget");

      await follow(viewer.jar, target.username);
      await createPost(target.jar, "Pre-mute post");
      await apiRequest(getServer().baseUrl, `/api/moderation/mute/${target.username}`, { method: "POST" }, viewer.jar);

      expect(await feedActors(viewer.jar)).not.toContain(target.username);
    });

    it("reflects new activity in the actor's own feed immediately, even after a stale empty page was already cached", async () => {
      const author = await signUpTestUser(getServer().baseUrl, "sffreshactivity");

      // Warms the feed's short in-memory TTL cache with an empty page, as
      // a user landing on "/" right after signing up would.
      expect((await readFollowingFeed(getServer().baseUrl, author.jar)).rows).toHaveLength(0);

      await createPost(author.jar, "Fresh activity right after signup");

      expect(await feedActors(author.jar)).toContain(author.username);
    });

    it("shows a log with an inline review as one card", async () => {
      const viewer = await signUpTestUser(getServer().baseUrl, "sfdedupviewer");
      const followed = await signUpTestUser(getServer().baseUrl, "sfdedupfollowed");
      const movie = await seedTestFilm("Feed Dedupe Movie");

      await follow(viewer.jar, followed.username);
      // diary_entry + review rows: deduped, then merged into one title card.
      await apiRequest(
        getServer().baseUrl,
        "/api/diary",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tmdbId: movie.tmdbId, watchedDate: "2026-01-01", review: "Dedup test review" }),
        },
        followed.jar,
      );
      await createPost(followed.jar, "Second activity for dedupe test");

      const { rows } = await readFollowingFeed(getServer().baseUrl, viewer.jar);
      const cards = titleGroups(rows).filter((group) => group.movie.tmdbId === movie.tmdbId);
      expect(cards).toHaveLength(1);
      expect(cards[0]).toMatchObject({ watched: true, review: { content: "Dedup test review" } });
    });
  });
});
