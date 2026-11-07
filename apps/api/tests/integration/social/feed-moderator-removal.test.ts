import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser, type SignedUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { promoteToAdmin } from "../../support/factories/admin.factory";
import { seedTestFilm } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { activities } from "../../../src/modules/social/social.entity";
import { comments } from "../../../src/modules/reviews/reviews.entity";
import { postComments } from "../../../src/modules/posts/posts.entity";
import type { ActivityType } from "../../../src/modules/social/repositories/social.repository";

type Notification = { type: string; entityId: string; metadata: string | null };
type Kind = "comment" | "post_comment" | "list";

describe("content a moderator removes leaves the Following Feed", () => {
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

  const userIdOf = async (username: string): Promise<string> => {
    const [row] = await db.select({ id: user.id }).from(user).where(eq(user.username, username));
    if (!row) throw new Error(`Test user ${username} not found`);
    return row.id;
  };

  const countActivities = async (userId: string, type: ActivityType, entityId: string) =>
    (
      await db
        .select({ id: activities.id })
        .from(activities)
        .where(and(eq(activities.userId, userId), eq(activities.type, type), eq(activities.entityId, entityId)))
    ).length;

  // Both feed endpoints, read once each: the fan's feed must not be cached before the removal.
  const feedsOf = async (jar: CookieJar) =>
    JSON.stringify([
      await send(jar, "GET", "/api/social/feed/following"),
      await send(jar, "GET", "/api/social/feed/grouped"),
    ]);

  // The author writes one piece of content of the given kind; the fan follows them.
  const setup = async (prefix: string, kind: Kind, text: string) => {
    const author = await signUpTestUser(getServer().baseUrl, `${prefix}a`);
    const fan = await signUpTestUser(getServer().baseUrl, `${prefix}f`);
    const admin = await signUpTestUser(getServer().baseUrl, `${prefix}m`);
    await promoteToAdmin(admin.username);
    await send(fan.jar, "POST", `/api/social/follow/${author.username}`);

    let id: string;
    if (kind === "list") {
      id = ((await send(author.jar, "POST", "/api/lists", { title: text, isPublic: true })) as { id: string }).id;
    } else if (kind === "comment") {
      const movie = await seedTestFilm();
      const review = (await send(author.jar, "POST", "/api/reviews", { tmdbId: movie.tmdbId, content: "A review" })) as {
        review: { id: string };
      };
      id = ((await send(author.jar, "POST", `/api/reviews/${review.review.id}/comments`, { content: text })) as { id: string }).id;
    } else {
      const post = (await send(author.jar, "POST", "/api/posts", { content: "A post" })) as { id: string };
      id = ((await send(author.jar, "POST", `/api/posts/${post.id}/comments`, { content: text })) as { id: string }).id;
    }

    return { author, fan, admin, id, authorId: await userIdOf(author.username) };
  };

  const activityTypeOf = (kind: Kind): ActivityType => (kind === "list" ? "created_list" : "commented");

  const expectGone = async (input: { kind: Kind; fan: SignedUpTestUser; authorId: string; id: string; text: string }) => {
    const feeds = await feedsOf(input.fan.jar);
    expect(feeds).not.toContain(input.text);
    expect(feeds).not.toContain(input.id);
    expect(await countActivities(input.authorId, activityTypeOf(input.kind), input.id)).toBe(0);
  };

  const adminDeletePath = (kind: Kind, id: string) =>
    kind === "list" ? `/api/admin/lists/${id}` : `/api/admin/comments/${kind === "comment" ? "review" : "post"}/${id}`;

  for (const kind of ["comment", "post_comment", "list"] as const) {
    it(`an admin delete of a ${kind} retracts its activity`, async () => {
      const text = `Admin removes this ${kind}`;
      const { fan, admin, id, authorId } = await setup(`fmad${kind.slice(0, 4)}`, kind, text);
      expect(await countActivities(authorId, activityTypeOf(kind), id)).toBe(1);

      await send(admin.jar, "DELETE", adminDeletePath(kind, id));
      await expectGone({ kind, fan, authorId, id, text });
    });

    it(`a report takedown of a ${kind} retracts its activity and tells the author`, async () => {
      const text = `Report removes this ${kind}`;
      const { author, fan, admin, id, authorId } = await setup(`fmrp${kind.slice(0, 4)}`, kind, text);
      const reporter = await signUpTestUser(getServer().baseUrl, `fmrp${kind.slice(0, 4)}r`);
      await send(reporter.jar, "POST", "/api/reports", { targetType: kind, targetId: id, reason: "spam" });
      const reports = (await send(admin.jar, "GET", "/api/reports?status=pending&limit=100")) as unknown as {
        id: string;
        targetId: string;
      }[];
      const report = reports.find((entry) => entry.targetId === id)!;

      await send(admin.jar, "POST", `/api/reports/${report.id}/remove-content`, { reason: "Spam", notifyAuthor: true });
      await expectGone({ kind, fan, authorId, id, text });

      const notices = ((await send(author.jar, "GET", "/api/notifications")) as { items: Notification[] }).items;
      const notice = notices.find((entry) => entry.type === "content_removed");
      expect(notice?.entityId).toBe(id);
      expect(JSON.parse(notice!.metadata!)).toMatchObject({ targetType: kind, reason: "Spam" });
      expect(JSON.parse(notice!.metadata!).excerpt).toContain(text);
    });
  }

  it("an admin comment delete leaves the author unnotified", async () => {
    const { author, admin, id } = await setup("fmadq", "comment", "Quiet removal");
    await send(admin.jar, "DELETE", adminDeletePath("comment", id));
    const notices = ((await send(author.jar, "GET", "/api/notifications")) as { items: Notification[] }).items;
    expect(notices.some((entry) => entry.type === "content_removed")).toBe(false);
  });
});

describe("a comment's feed card follows the live comment", () => {
  let testServer: RunningTestServer | null = null;

  beforeAll(async () => {
    testServer = await startTestServer();
  });

  afterAll(async () => {
    if (!testServer) return;
    await testServer.close();
    testServer = null;
  });

  const send = async (jar: CookieJar, method: string, path: string, body?: unknown) => {
    const response = await apiRequest(
      testServer!.baseUrl,
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

  type FeedItem = { kind: string; metadata: { commentId: string | null; excerpt: string | null } };

  const commentItems = async (jar: CookieJar) =>
    ((await send(jar, "GET", "/api/social/feed/following")) as { items: FeedItem[] }).items.filter(
      (item) => item.kind === "commented" || item.kind === "commented_post",
    );

  const commentOnBoth = async (prefix: string) => {
    const author = await signUpTestUser(testServer!.baseUrl, `${prefix}a`);
    const fan = await signUpTestUser(testServer!.baseUrl, `${prefix}f`);
    await send(fan.jar, "POST", `/api/social/follow/${author.username}`);
    const movie = await seedTestFilm();
    const review = (await send(author.jar, "POST", "/api/reviews", { tmdbId: movie.tmdbId, content: "R" })) as {
      review: { id: string };
    };
    const post = (await send(author.jar, "POST", "/api/posts", { content: "P" })) as { id: string };
    const reviewComment = (await send(author.jar, "POST", `/api/reviews/${review.review.id}/comments`, {
      content: "Review comment text",
    })) as { id: string };
    const postComment = (await send(author.jar, "POST", `/api/posts/${post.id}/comments`, {
      content: "Post comment text",
    })) as { id: string };
    return { fan, reviewCommentId: reviewComment.id, postCommentId: postComment.id };
  };

  it("drops a comment's activity when the comment is gone but its activity was left behind", async () => {
    const { fan, reviewCommentId, postCommentId } = await commentOnBoth("fmlvd");
    await db.delete(comments).where(eq(comments.id, reviewCommentId));
    await db.delete(postComments).where(eq(postComments.id, postCommentId));

    expect(await commentItems(fan.jar)).toHaveLength(0);
  });

  it("shows the comment's current text, not the copy taken when it was posted", async () => {
    const { fan, reviewCommentId, postCommentId } = await commentOnBoth("fmlvt");
    await db.update(comments).set({ content: "Edited review comment" }).where(eq(comments.id, reviewCommentId));
    await db.update(postComments).set({ content: "Edited post comment" }).where(eq(postComments.id, postCommentId));

    const excerpts = Object.fromEntries((await commentItems(fan.jar)).map((item) => [item.metadata.commentId, item.metadata.excerpt]));
    expect(excerpts).toEqual({ [reviewCommentId]: "Edited review comment", [postCommentId]: "Edited post comment" });
  });
});
