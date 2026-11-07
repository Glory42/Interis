import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { promoteToAdmin } from "../../support/factories/admin.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

type Overview = {
  computedAt: string;
  needsYou: {
    pendingReports: number;
    oldestPendingAt: string | null;
    reportedItems: number;
    suspensionsEndingSoon: number;
  };
  lastSevenDays: {
    newAccounts: number;
    diaryEntries: number;
    reviews: number;
    posts: number;
    comments: number;
  };
  cache: { films: number; series: number };
  latestActions: { action: string; targetLabel: string | null; actorUsername: string; createdAt: string }[];
};

describe("admin overview", () => {
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

  const send = (path: string, body: unknown, jar: CookieJar) =>
    apiRequest(
      getServer().baseUrl,
      path,
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
      jar,
    );

  const overviewFor = async (jar: CookieJar): Promise<Overview> => {
    const response = await apiRequest(getServer().baseUrl, "/api/admin/overview", {}, jar);
    expect(response.status).toBe(200);
    return (await response.json()) as Overview;
  };

  it("counts what needs an admin and what happened this week", async () => {
    const admin = await signUpTestUser(getServer().baseUrl, "ovadm");
    await promoteToAdmin(admin.username);
    const before = await overviewFor(admin.jar);

    const author = await signUpTestUser(getServer().baseUrl, "ovauth");
    const reporter = await signUpTestUser(getServer().baseUrl, "ovrep");
    const created = await send("/api/posts", { content: "A post someone will report" }, author.jar);
    const { id: postId } = (await created.json()) as { id: string };
    expect((await send("/api/reports", { targetType: "post", targetId: postId, reason: "spam" }, reporter.jar)).ok).toBe(true);
    expect(
      (await send(`/api/admin/users/${author.username}/suspend`, { durationDays: 3, adminPassword: admin.password }, admin.jar)).ok,
    ).toBe(true);

    const after = await overviewFor(admin.jar);
    expect(after.needsYou.pendingReports).toBe(before.needsYou.pendingReports + 1);
    expect(after.needsYou.reportedItems).toBe(before.needsYou.reportedItems + 1);
    expect(after.needsYou.oldestPendingAt).not.toBeNull();
    expect(after.needsYou.suspensionsEndingSoon).toBe(before.needsYou.suspensionsEndingSoon + 1);
    expect(after.lastSevenDays.newAccounts).toBe(before.lastSevenDays.newAccounts + 2);
    expect(after.lastSevenDays.posts).toBe(before.lastSevenDays.posts + 1);
    expect(after.latestActions[0]).toMatchObject({ action: "user.suspend", targetLabel: author.username });
    expect(after.latestActions.length).toBeLessThanOrEqual(5);
    expect(Date.parse(after.computedAt)).toBeGreaterThan(Date.parse(before.computedAt) - 1);
    expect(after.cache).toEqual({ films: expect.any(Number), series: expect.any(Number) });
  });

  it("is admin-only", async () => {
    const member = await signUpTestUser(getServer().baseUrl, "ovmem");
    expect((await apiRequest(getServer().baseUrl, "/api/admin/overview", {}, member.jar)).status).toBe(403);
  });
});
