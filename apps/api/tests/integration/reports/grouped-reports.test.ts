import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "../../../src/infrastructure/database/db";
import { reports } from "../../../src/modules/reports/reports.entity";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { promoteToAdmin } from "../../support/factories/admin.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

type GroupedRow = {
  targetType: string;
  targetId: string;
  reportCount: number;
  reasons: string[];
  authorUsername: string | null;
  oldestReportAt: string;
  reportId: string;
  reports: { reporterUsername: string; reason: string; details: string | null }[];
};

describe("reports grouped by item", () => {
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

  const send = (jar: CookieJar, path: string, method: string, body?: unknown) =>
    apiRequest(
      getServer().baseUrl,
      path,
      body === undefined
        ? { method }
        : { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
      jar,
    );

  const reportedPost = async (prefix: string, reasons: string[]) => {
    const author = await signUpTestUser(getServer().baseUrl, `${prefix}a`);
    const post = (await (await send(author.jar, "/api/posts", "POST", { content: "reported post" })).json()) as {
      id: string;
    };
    for (const [index, reason] of reasons.entries()) {
      const reporter = await signUpTestUser(getServer().baseUrl, `${prefix}r${index}`);
      expect((await send(reporter.jar, "/api/reports", "POST", { targetType: "post", targetId: post.id, reason })).status).toBe(201);
    }
    return { author, postId: post.id };
  };

  const grouped = async (jar: CookieJar) => {
    const response = await apiRequest(getServer().baseUrl, "/api/reports/grouped?status=pending&limit=100", {}, jar);
    expect(response.status).toBe(200);
    return (await response.json()) as GroupedRow[];
  };

  it("lists one row per reported item with its count, reasons, author and oldest report", async () => {
    const admin = await signUpTestUser(getServer().baseUrl, "grpadm");
    await promoteToAdmin(admin.username);
    const { author, postId } = await reportedPost("grp1", ["spam", "spam", "harassment"]);

    const row = (await grouped(admin.jar)).find((item) => item.targetId === postId);
    expect(row).toMatchObject({
      targetType: "post",
      reportCount: 3,
      authorUsername: author.username,
    });
    expect([...row!.reasons].sort()).toEqual(["harassment", "spam"]);
    expect(Number.isNaN(Date.parse(row!.oldestReportAt))).toBe(false);
  });

  it("resolves every pending report on an item at once, with a note, and audits it", async () => {
    const admin = await signUpTestUser(getServer().baseUrl, "grpres");
    await promoteToAdmin(admin.username);
    const { postId } = await reportedPost("grp2", ["spam", "other"]);

    const response = await send(admin.jar, `/api/reports/targets/post/${postId}/resolve`, "POST", {
      note: "warned the author",
    });
    expect(response.status).toBe(200);

    const rows = await db.select().from(reports).where(eq(reports.targetId, postId));
    expect(rows.map((row) => [row.status, row.resolutionAction, row.resolutionNote])).toEqual([
      ["resolved", "resolved", "warned the author"],
      ["resolved", "resolved", "warned the author"],
    ]);
    expect((await grouped(admin.jar)).some((item) => item.targetId === postId)).toBe(false);

    const audit = (await (await apiRequest(getServer().baseUrl, `/api/admin/audit?actor=${admin.username}`, {}, admin.jar)).json()) as {
      items: { action: string; targetId: string; reason: string | null }[];
    };
    expect(audit.items[0]).toMatchObject({ action: "report.resolve_all", targetId: postId, reason: "warned the author" });
  });

  it("dismisses every pending report on an item", async () => {
    const admin = await signUpTestUser(getServer().baseUrl, "grpdis");
    await promoteToAdmin(admin.username);
    const { postId } = await reportedPost("grp3", ["other"]);

    expect((await send(admin.jar, `/api/reports/targets/post/${postId}/dismiss`, "POST", {})).status).toBe(200);
    const [row] = await db.select().from(reports).where(eq(reports.targetId, postId));
    expect(row).toMatchObject({ status: "dismissed", resolutionAction: "dismissed", resolutionNote: null });
  });

  it("lists who reported what on each item, with a report id to act on", async () => {
    const admin = await signUpTestUser(getServer().baseUrl, "grpwho");
    await promoteToAdmin(admin.username);
    const { postId } = await reportedPost("grp4", ["spam", "harassment"]);

    const row = (await grouped(admin.jar)).find((item) => item.targetId === postId)!;
    expect(row.reports.map((report) => [report.reporterUsername.split("_")[0], report.reason])).toEqual([
      ["grp4r0", "spam"],
      ["grp4r1", "harassment"],
    ]);
    expect(typeof row.reportId).toBe("string");
    expect((await send(admin.jar, `/api/reports/${row.reportId}/remove-content`, "POST", { reason: "spam" })).status).toBe(200);
    expect((await grouped(admin.jar)).some((item) => item.targetId === postId)).toBe(false);
  });

  it("names the author of a reported comment or list", async () => {
    const admin = await signUpTestUser(getServer().baseUrl, "grpcl");
    await promoteToAdmin(admin.username);
    const author = await signUpTestUser(getServer().baseUrl, "grpcla");
    const reporter = await signUpTestUser(getServer().baseUrl, "grpclr");
    const post = (await (await send(author.jar, "/api/posts", "POST", { content: "host post" })).json()) as { id: string };
    const comment = (await (await send(author.jar, `/api/posts/${post.id}/comments`, "POST", { content: "rude" })).json()) as { id: string };
    const list = (await (await send(author.jar, "/api/lists", "POST", { title: "Bad list" })).json()) as { id: string };
    await send(reporter.jar, "/api/reports", "POST", { targetType: "post_comment", targetId: comment.id, reason: "harassment" });
    await send(reporter.jar, "/api/reports", "POST", { targetType: "list", targetId: list.id, reason: "other" });

    const rows = await grouped(admin.jar);
    expect(rows.find((item) => item.targetId === comment.id)?.authorUsername).toBe(author.username);
    expect(rows.find((item) => item.targetId === list.id)?.authorUsername).toBe(author.username);
  });
});
