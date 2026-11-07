import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { promoteToAdmin } from "../../support/factories/admin.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

type Notification = { type: string; actorId: string; actorUsername: string; entityId: string; metadata: string | null };

describe("taking reported content down with a reason", () => {
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

  const reportedPost = async (prefix: string) => {
    const author = await signUpTestUser(getServer().baseUrl, `${prefix}a`);
    const reporter = await signUpTestUser(getServer().baseUrl, `${prefix}r`);
    const admin = await signUpTestUser(getServer().baseUrl, `${prefix}m`);
    await promoteToAdmin(admin.username);
    const post = await json<{ id: string }>(await send("/api/posts", "POST", { content: "Buy cheap watches here" }, author.jar));
    await send("/api/reports", "POST", { targetType: "post", targetId: post.id, reason: "spam" }, reporter.jar);
    const reports = await json<{ id: string; targetId: string }[]>(await send("/api/reports?status=pending&limit=100", "GET", undefined, admin.jar));
    const report = reports.find((entry) => entry.targetId === post.id)!;
    return { author, admin, post, report };
  };

  const notificationsOf = async (jar: CookieJar) =>
    (await json<{ items: Notification[] }>(await send("/api/notifications", "GET", undefined, jar))).items;

  it("writes the reason to the audit log and tells the author, without naming the moderator", async () => {
    const { author, admin, post, report } = await reportedPost("tdn");

    const removed = await send(`/api/reports/${report.id}/remove-content`, "POST", { reason: "Advertising", notifyAuthor: true }, admin.jar);
    expect(removed.status).toBe(200);

    const audit = await json<{ items: { action: string; reason: string | null }[] }>(
      await send(`/api/admin/audit?actor=${admin.username}`, "GET", undefined, admin.jar),
    );
    expect(audit.items[0]).toMatchObject({ action: "report.remove_content", reason: "Advertising" });

    const [notice] = await notificationsOf(author.jar);
    expect(notice).toMatchObject({ type: "content_removed", entityId: post.id, actorUsername: author.username });
    expect(JSON.parse(notice!.metadata!)).toMatchObject({ targetType: "post", reason: "Advertising", excerpt: "Buy cheap watches here" });
  });

  it("leaves the author's notifications alone unless asked to notify", async () => {
    const { author, admin, report } = await reportedPost("tdq");

    expect((await send(`/api/reports/${report.id}/remove-content`, "POST", { reason: "Spam" }, admin.jar)).status).toBe(200);
    expect((await notificationsOf(author.jar)).some((entry) => entry.type === "content_removed")).toBe(false);
  });

  it("rejects a reason that is too long", async () => {
    const { admin, report } = await reportedPost("tdl");
    expect((await send(`/api/reports/${report.id}/remove-content`, "POST", { reason: "x".repeat(501) }, admin.jar)).status).toBe(400);
  });
});
