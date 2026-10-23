import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { seedTestMovie, seedTestSerial } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { activities } from "../../../src/modules/social/social.entity";
import type { ActivityType } from "../../../src/modules/social/repositories/social.repository";

// Media activities are recorded fire-and-forget, so give the insert a
// moment to land before asserting on it.
const waitForActivityWrite = () => new Promise((resolve) => setTimeout(resolve, 150));

type FeedItem = {
  type: string;
  kind: string;
  review: { id: string; content: string } | null;
  post: { id: string; content: string } | null;
  metadata: { excerpt: string | null; hasReview?: boolean | null; reviewId: string | null };
};

const getUserId = async (username: string): Promise<string> => {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
  if (!row) throw new Error(`Test user ${username} not found`);
  return row.id;
};

const countActivities = async (userId: string, type: ActivityType) => {
  const rows = await db
    .select({ id: activities.id })
    .from(activities)
    .where(and(eq(activities.userId, userId), eq(activities.type, type)));
  return rows.length;
};

describe("deleted reviews and posts leave the feed (#77, #78)", () => {
  let testServer: RunningTestServer | null = null;

  const getServer = (): RunningTestServer => {
    if (!testServer) throw new Error("Test server is not running");
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

  const send = async (jar: CookieJar | undefined, method: string, path: string, body?: unknown) => {
    const response = await apiRequest(
      getServer().baseUrl,
      path,
      {
        method,
        headers: body === undefined ? {} : { "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
      },
      jar,
    );
    expect(response.status).toBeLessThan(300);
    return (await response.json().catch(() => null)) as Record<string, unknown> | null;
  };

  const getFeed = async (jar: CookieJar) =>
    ((await send(jar, "GET", "/api/social/feed")) as { items: FeedItem[] }).items;

  // Follower and author, with the follower's feed not fetched yet so the
  // 20s feed cache can't hide what the delete changed.
  const signUpPair = async (prefix: string) => {
    const author = await signUpTestUser(getServer().baseUrl, `${prefix}a`);
    const fan = await signUpTestUser(getServer().baseUrl, `${prefix}f`);
    await send(fan.jar, "POST", `/api/social/follow/${author.username}`);
    return { author, fan };
  };

  it("drops a deleted review and everything about it", async () => {
    const { author, fan } = await signUpPair("fdrev");
    const authorId = await getUserId(author.username);
    const movie = await seedTestMovie();

    const created = (await send(author.jar, "POST", "/api/reviews", {
      tmdbId: movie.tmdbId,
      content: "Secret regret review",
    })) as { review: { id: string } };
    const reviewId = created.review.id;
    await send(fan.jar, "POST", `/api/reviews/${reviewId}/like`);
    await send(fan.jar, "POST", `/api/reviews/${reviewId}/comments`, { content: "Agreed" });
    await waitForActivityWrite();
    expect(await countActivities(authorId, "review")).toBe(1);

    await send(author.jar, "DELETE", `/api/reviews/${reviewId}`);
    expect(await countActivities(authorId, "review")).toBe(0);

    // The fan's own like and comment rows still exist, but point at nothing.
    const feed = await getFeed(fan.jar);
    expect(JSON.stringify(feed)).not.toContain(reviewId);
    expect(JSON.stringify(feed)).not.toContain("Secret regret review");

    const publicActivity = await send(undefined, "GET", `/api/public/${author.username}/activity`);
    expect(JSON.stringify(publicActivity)).not.toContain("Secret regret review");
  });

  it("keeps a diary entry whose review was deleted, without the review text", async () => {
    const { author, fan } = await signUpPair("fddiary");
    const movie = await seedTestMovie();

    const logged = (await send(author.jar, "POST", "/api/diary", {
      tmdbId: movie.tmdbId,
      watchedDate: "2026-01-01",
      review: "Diary review to delete",
    })) as { review: { id: string } };
    await waitForActivityWrite();
    await send(author.jar, "DELETE", `/api/reviews/${logged.review.id}`);

    const feed = await getFeed(fan.jar);
    const diaryItems = feed.filter((item) => item.type === "diary_entry");
    expect(diaryItems).toHaveLength(1);
    expect(diaryItems[0]).toMatchObject({
      review: null,
      metadata: { excerpt: null, hasReview: false, reviewId: null },
    });
    expect(JSON.stringify(feed)).not.toContain("Diary review to delete");
  });

  it("shows the edited review text, not the text from when it was liked", async () => {
    const { author, fan } = await signUpPair("fdedit");
    const movie = await seedTestMovie();

    const created = (await send(author.jar, "POST", "/api/reviews", {
      tmdbId: movie.tmdbId,
      content: "First draft",
    })) as { review: { id: string } };
    await send(fan.jar, "POST", `/api/reviews/${created.review.id}/like`);
    await send(author.jar, "PUT", `/api/reviews/${created.review.id}`, { content: "Final take" });

    const feed = await getFeed(fan.jar);
    const likeItem = feed.find((item) => item.kind === "liked_review");
    expect(likeItem?.metadata.excerpt).toBe("Final take");
    expect(JSON.stringify(feed)).not.toContain("First draft");
  });

  it("drops a deleted post and the likes and comments on it", async () => {
    const { author, fan } = await signUpPair("fdpost");
    const authorId = await getUserId(author.username);

    const postId = ((await send(author.jar, "POST", "/api/posts", {
      content: "Post I will delete",
    })) as { id: string }).id;
    await send(fan.jar, "POST", `/api/posts/${postId}/like`);
    await send(fan.jar, "POST", `/api/posts/${postId}/comments`, { content: "Hm" });

    await send(author.jar, "DELETE", `/api/posts/${postId}`);
    expect(await countActivities(authorId, "post")).toBe(0);

    const feed = await getFeed(fan.jar);
    expect(JSON.stringify(feed)).not.toContain(postId);
    expect(JSON.stringify(feed)).not.toContain("Post I will delete");
  });

  it("removes a comment's feed row when the comment is deleted", async () => {
    const author = await signUpTestUser(getServer().baseUrl, "fdcmta");
    const commenter = await signUpTestUser(getServer().baseUrl, "fdcmtc");
    const commenterId = await getUserId(commenter.username);
    const movie = await seedTestMovie();

    const created = (await send(author.jar, "POST", "/api/reviews", {
      tmdbId: movie.tmdbId,
      content: "Comment target",
    })) as { review: { id: string } };
    const postId = ((await send(author.jar, "POST", "/api/posts", { content: "Post" })) as {
      id: string;
    }).id;

    const reviewComment = (await send(
      commenter.jar,
      "POST",
      `/api/reviews/${created.review.id}/comments`,
      { content: "Review comment" },
    )) as { id: string };
    const postComment = (await send(commenter.jar, "POST", `/api/posts/${postId}/comments`, {
      content: "Post comment",
    })) as { id: string };
    expect(await countActivities(commenterId, "commented")).toBe(2);

    await send(commenter.jar, "DELETE", `/api/reviews/comments/${reviewComment.id}`);
    await send(commenter.jar, "DELETE", `/api/posts/comments/${postComment.id}`);
    expect(await countActivities(commenterId, "commented")).toBe(0);
  });

  it("removes a season review's feed row when the review is deleted", async () => {
    const { author, fan } = await signUpPair("fdseason");
    const authorId = await getUserId(author.username);
    const serial = await seedTestSerial();
    const base = `/api/serials/${serial.tmdbId}/seasons/1/review`;

    await send(author.jar, "POST", base, { content: "Season take to delete" });
    await waitForActivityWrite();
    expect(await countActivities(authorId, "review")).toBe(1);

    await send(author.jar, "DELETE", base);
    expect(await countActivities(authorId, "review")).toBe(0);
    expect(JSON.stringify(await getFeed(fan.jar))).not.toContain("Season take to delete");
  });
});
