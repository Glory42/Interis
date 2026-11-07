import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { promoteToAdmin } from "../../support/factories/admin.factory";
import { seedTestFilm } from "../../support/factories/media.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

type AuditEntry = {
  id: string;
  actorUsername: string;
  action: string;
  targetType: string;
  targetId: string;
  targetLabel: string | null;
  reason: string | null;
  createdAt: string;
};

type AuditPage = { items: AuditEntry[]; nextCursor: string | null };

describe("admin audit log", () => {
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

  const getAudit = async (jar: CookieJar, query = ""): Promise<AuditPage> => {
    const response = await apiRequest(getServer().baseUrl, `/api/admin/audit${query}`, {}, jar);
    expect(response.status).toBe(200);
    return (await response.json()) as AuditPage;
  };

  it("records who suspended whom, and why", async () => {
    const admin = await signUpTestUser(getServer().baseUrl, "auditadm");
    await promoteToAdmin(admin.username);
    const target = await signUpTestUser(getServer().baseUrl, "audittgt");

    const response = await send(admin.jar, `/api/admin/users/${target.username}/suspend`, "POST", {
      reason: "spam links",
      adminPassword: admin.password,
    });
    expect(response.status).toBe(200);

    const { items } = await getAudit(admin.jar, `?actor=${admin.username}`);
    expect(items[0]).toMatchObject({
      actorUsername: admin.username,
      action: "user.suspend",
      targetType: "user",
      targetLabel: target.username,
      reason: "spam links",
    });
  });

  it("records content removal and pages newest first with a cursor", async () => {
    const admin = await signUpTestUser(getServer().baseUrl, "auditpage");
    await promoteToAdmin(admin.username);
    const author = await signUpTestUser(getServer().baseUrl, "auditauth");
    const movie = await seedTestFilm("Audit Movie");

    const created = (await (
      await send(author.jar, "/api/reviews", "POST", { tmdbId: movie.tmdbId, content: "To be removed" })
    ).json()) as { review: { id: string } };
    expect((await send(admin.jar, `/api/admin/reviews/${created.review.id}`, "DELETE")).status).toBe(200);
    expect((await send(admin.jar, `/api/admin/users/${author.username}/unsuspend`, "POST")).status).toBe(200);

    const first = await getAudit(admin.jar, `?actor=${admin.username}&limit=1`);
    expect(first.items.map((item) => item.action)).toEqual(["user.unsuspend"]);
    expect(first.nextCursor).not.toBeNull();

    const second = await getAudit(admin.jar, `?actor=${admin.username}&limit=1&cursor=${encodeURIComponent(first.nextCursor!)}`);
    expect(second.items).toHaveLength(1);
    expect(second.items[0]).toMatchObject({
      action: "review.delete",
      targetType: "review",
      targetId: created.review.id,
    });
    expect(second.nextCursor).toBeNull();
  });

  it("is admin-only", async () => {
    const member = await signUpTestUser(getServer().baseUrl, "auditmem");
    const response = await apiRequest(getServer().baseUrl, "/api/admin/audit", {}, member.jar);
    expect(response.status).toBe(403);
  });
});
