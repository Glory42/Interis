import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { promoteToAdmin } from "../../support/factories/admin.factory";
import { seedTestMovie } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

type Report = { id: string; targetType: string; targetId: string; contentSnapshot: string };

describe("reporting comments and lists", () => {
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

  const send = (path: string, method: string, body: unknown, jar?: CookieJar) =>
    apiRequest(
      getServer().baseUrl,
      path,
      body === undefined ? { method } : { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
      jar,
    );
  const json = async <T>(response: Response) => (await response.json()) as T;

  const setup = async (prefix: string) => {
    const author = await signUpTestUser(getServer().baseUrl, `${prefix}a`);
    const reporter = await signUpTestUser(getServer().baseUrl, `${prefix}r`);
    const admin = await signUpTestUser(getServer().baseUrl, `${prefix}m`);
    await promoteToAdmin(admin.username);
    return { author, reporter, admin };
  };

  const pendingReportFor = async (targetId: string, jar: CookieJar) => {
    const reports = await json<Report[]>(await send("/api/reports?status=pending&limit=100", "GET", undefined, jar));
    return reports.find((report) => report.targetId === targetId);
  };

  it("reports a comment on a post, and removing it deletes the comment", async () => {
    const { author, reporter, admin } = await setup("rtpc");
    const post = await json<{ id: string }>(await send("/api/posts", "POST", { content: "A post" }, author.jar));
    const comment = await json<{ id: string }>(
      await send(`/api/posts/${post.id}/comments`, "POST", { content: "A rude comment" }, author.jar),
    );

    const reported = await send("/api/reports", "POST", { targetType: "post_comment", targetId: comment.id, reason: "harassment" }, reporter.jar);
    expect(reported.status).toBe(201);
    const report = await pendingReportFor(comment.id, admin.jar);
    expect(report).toMatchObject({ targetType: "post_comment", contentSnapshot: "A rude comment" });

    expect((await send(`/api/reports/${report!.id}/remove-content`, "POST", {}, admin.jar)).status).toBe(200);
    const comments = await json<{ id: string }[]>(await send(`/api/posts/${post.id}/comments`, "GET", undefined));
    expect(comments.map((entry) => entry.id)).not.toContain(comment.id);
  });

  it("reports a comment on a review", async () => {
    const { author, reporter, admin } = await setup("rtrc");
    const movie = await seedTestMovie("Report Target Movie");
    const { review } = await json<{ review: { id: string } }>(
      await send("/api/reviews", "POST", { tmdbId: movie.tmdbId, content: "A review" }, author.jar),
    );
    const comment = await json<{ id: string }>(
      await send(`/api/reviews/${review.id}/comments`, "POST", { content: "Spam spam spam" }, author.jar),
    );

    expect((await send("/api/reports", "POST", { targetType: "comment", targetId: comment.id, reason: "spam" }, reporter.jar)).status).toBe(201);
    expect(await pendingReportFor(comment.id, admin.jar)).toMatchObject({ targetType: "comment", contentSnapshot: "Spam spam spam" });
  });

  it("reports a list by its title and description, and removing it deletes the list", async () => {
    const { author, reporter, admin } = await setup("rtls");
    const list = await json<{ id: string }>(
      await send("/api/lists", "POST", { title: "Bad list", description: "Not nice" }, author.jar),
    );

    expect((await send("/api/reports", "POST", { targetType: "list", targetId: list.id, reason: "inappropriate" }, reporter.jar)).status).toBe(201);
    const report = await pendingReportFor(list.id, admin.jar);
    expect(report).toMatchObject({ targetType: "list", contentSnapshot: "Bad list — Not nice" });

    expect((await send(`/api/reports/${report!.id}/remove-content`, "POST", {}, admin.jar)).status).toBe(200);
    expect((await send(`/api/lists/${list.id}`, "GET", undefined, admin.jar)).status).toBe(404);
  });

  it("404s for a comment or list that doesn't exist", async () => {
    const { reporter } = await setup("rt404");
    const missing = "00000000-0000-4000-8000-000000000000";
    for (const targetType of ["comment", "post_comment", "list"]) {
      expect((await send("/api/reports", "POST", { targetType, targetId: missing, reason: "spam" }, reporter.jar)).status).toBe(404);
    }
  });

  it("lets admins list every comment and delete one, with an audit entry", async () => {
    const { author, admin } = await setup("rtadm");
    const post = await json<{ id: string }>(await send("/api/posts", "POST", { content: "Another post" }, author.jar));
    const comment = await json<{ id: string }>(
      await send(`/api/posts/${post.id}/comments`, "POST", { content: "Admin can see me" }, author.jar),
    );

    const page = await json<{ kind: string; id: string; content: string; authorUsername: string }[]>(
      await send("/api/admin/comments?limit=20", "GET", undefined, admin.jar),
    );
    expect(page.find((entry) => entry.id === comment.id)).toMatchObject({
      kind: "post",
      content: "Admin can see me",
      authorUsername: author.username,
    });

    expect((await send(`/api/admin/comments/post/${comment.id}`, "DELETE", undefined, admin.jar)).status).toBe(200);
    const audit = await json<{ items: { action: string }[] }>(await send(`/api/admin/audit?actor=${admin.username}`, "GET", undefined, admin.jar));
    expect(audit.items[0]?.action).toBe("comment.delete");
  });
});
