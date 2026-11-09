import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { and, eq } from "drizzle-orm";
import { db } from "../../../src/infrastructure/database/db";
import { user } from "../../../src/infrastructure/database/auth.entity";
import { adminAuditLog } from "../../../src/modules/admin/admin-audit-log.entity";
import { reports } from "../../../src/modules/reports/reports.entity";
import { ModeratorActionService } from "../../../src/modules/admin/services/moderator-action.service";
import type { RemovableContentType } from "../../../src/commons/types/content-removal.types";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser, type SignedUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { promoteToAdmin } from "../../support/factories/admin.factory";
import { seedTestFilm } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

describe("moderator action: remove content", () => {
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

  const send = async <T>(jar: CookieJar, path: string, method: string, body?: unknown) => {
    const response = await apiRequest(
      getServer().baseUrl,
      path,
      body === undefined ? { method } : { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
      jar,
    );
    return { status: response.status, body: (await response.json()) as T };
  };

  // Creates one piece of content of the given type and files a Report on it.
  const reportedContent = async (type: RemovableContentType, prefix: string) => {
    const author = await signUpTestUser(getServer().baseUrl, `${prefix}a`);
    const reporter = await signUpTestUser(getServer().baseUrl, `${prefix}r`);
    const admin = await signUpTestUser(getServer().baseUrl, `${prefix}m`);
    await promoteToAdmin(admin.username);

    const id = await createContent(type, author);
    const reported = await send(reporter.jar, "/api/reports", "POST", { targetType: type, targetId: id, reason: "spam" });
    expect(reported.status).toBe(201);
    return { id, admin };
  };

  const createContent = async (type: RemovableContentType, author: SignedUpTestUser): Promise<string> => {
    if (type === "list") {
      return (await send<{ id: string }>(author.jar, "/api/lists", "POST", { title: "Reported list" })).body.id;
    }
    if (type === "post" || type === "post_comment") {
      const post = (await send<{ id: string }>(author.jar, "/api/posts", "POST", { content: "Reported post" })).body;
      if (type === "post") return post.id;
      return (await send<{ id: string }>(author.jar, `/api/posts/${post.id}/comments`, "POST", { content: "Rude" })).body.id;
    }
    const movie = await seedTestFilm("Moderated Film");
    const { review } = (
      await send<{ review: { id: string } }>(author.jar, "/api/reviews", "POST", { tmdbId: movie.tmdbId, content: "Reported review" })
    ).body;
    if (type === "review") return review.id;
    return (await send<{ id: string }>(author.jar, `/api/reviews/${review.id}/comments`, "POST", { content: "Rude" })).body.id;
  };

  const adminPanelPath: Record<RemovableContentType, (id: string) => string> = {
    review: (id) => `/api/admin/reviews/${id}`,
    post: (id) => `/api/admin/posts/${id}`,
    comment: (id) => `/api/admin/comments/review/${id}`,
    post_comment: (id) => `/api/admin/comments/post/${id}`,
    list: (id) => `/api/admin/lists/${id}`,
  };

  const reportsOn = (type: RemovableContentType, id: string) =>
    db.select().from(reports).where(and(eq(reports.targetType, type), eq(reports.targetId, id)));

  const auditFor = (targetType: string, targetId: string) =>
    db.select().from(adminAuditLog).where(and(eq(adminAuditLog.targetType, targetType), eq(adminAuditLog.targetId, targetId)));

  const actorOf = async (admin: SignedUpTestUser) => {
    const [row] = await db.select({ id: user.id, username: user.username }).from(user).where(eq(user.username, admin.username));
    return { id: row!.id, username: row!.username! };
  };

  const types: RemovableContentType[] = ["review", "post", "comment", "post_comment", "list"];

  for (const type of types) {
    it(`removing a reported ${type} from the admin panel closes its pending Reports`, async () => {
      const { id, admin } = await reportedContent(type, `mp${type.slice(0, 3)}`);

      expect((await send(admin.jar, adminPanelPath[type](id), "DELETE")).status).toBe(200);

      const [report] = await reportsOn(type, id);
      expect(report).toMatchObject({ status: "resolved", resolutionAction: "content_removed" });
    });
  }

  it("removes the content, closes its Reports and writes the audit entry", async () => {
    const { id, admin } = await reportedContent("review", "mpaud");
    const actor = await actorOf(admin);

    expect(await ModeratorActionService.removeContent({ type: "review", id }, actor, { reason: "Off-topic" })).toBe(true);

    const [report] = await reportsOn("review", id);
    expect(report).toMatchObject({ status: "resolved", resolvedBy: actor.id });
    const [entry] = await auditFor("review", id);
    expect(entry).toMatchObject({ actorUsername: actor.username, action: "review.delete", reason: "Off-topic" });
  });

  it("names the Report in the audit entry when acting from the report queue", async () => {
    const { id, admin } = await reportedContent("post_comment", "mprep");
    const actor = await actorOf(admin);
    const [report] = await reportsOn("post_comment", id);

    await ModeratorActionService.removeContent({ type: "post_comment", id }, actor, { reportId: report!.id });

    expect(await auditFor("post_comment", id)).toHaveLength(0);
    const [entry] = await auditFor("report", report!.id);
    expect(entry).toMatchObject({ action: "report.remove_content", actorId: actor.id });
  });

  it("does nothing for content that no longer exists", async () => {
    const { id, admin } = await reportedContent("post", "mpgone");
    const actor = await actorOf(admin);
    expect(await ModeratorActionService.removeContent({ type: "post", id }, actor)).toBe(true);

    expect(await ModeratorActionService.removeContent({ type: "post", id }, actor)).toBe(false);
    expect(await auditFor("post", id)).toHaveLength(1);
  });
});
