import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { user as userTable } from "../../../src/infrastructure/database/auth.entity";
import { profiles } from "../../../src/modules/users/users.entity";

const promoteToAdmin = async (username: string): Promise<void> => {
  const [row] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.username, username))
    .limit(1);

  if (!row) {
    throw new Error(`Test user ${username} not found`);
  }

  await db.update(profiles).set({ isAdmin: true }).where(eq(profiles.userId, row.id));
};

describe("reports", () => {
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

  it("requires auth to submit a report", async () => {
    const response = await apiRequest(getServer().baseUrl, "/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ targetType: "post", targetId: "x", reason: "spam" }),
    });
    expect(response.status).toBe(401);
  });

  it("rejects listing reports for a non-admin", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "repa");

    const response = await apiRequest(getServer().baseUrl, "/api/reports", {}, jar);
    expect(response.status).toBe(403);
  });

  it("404s when reporting a post that doesn't exist", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "repb");

    const response = await apiRequest(
      getServer().baseUrl,
      "/api/reports",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetType: "post",
          targetId: "00000000-0000-0000-0000-000000000000",
          reason: "spam",
        }),
      },
      jar,
    );
    expect(response.status).toBe(404);
  });

  it("submits a report on a post and an admin can resolve it", async () => {
    const reporter = await signUpTestUser(getServer().baseUrl, "repc");
    const postAuthor = await signUpTestUser(getServer().baseUrl, "repd");
    const admin = await signUpTestUser(getServer().baseUrl, "repe");
    await promoteToAdmin(admin.username);

    const createPost = await apiRequest(
      getServer().baseUrl,
      "/api/posts",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "spammy content" }),
      },
      postAuthor.jar,
    );
    const post = (await createPost.json()) as { id: string };

    const submitResponse = await apiRequest(
      getServer().baseUrl,
      "/api/reports",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetType: "post",
          targetId: post.id,
          reason: "spam",
          details: "This looks like spam",
        }),
      },
      reporter.jar,
    );
    expect(submitResponse.status).toBe(201);

    // Resubmitting the same report is idempotent, not a conflict error.
    const resubmitResponse = await apiRequest(
      getServer().baseUrl,
      "/api/reports",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetType: "post", targetId: post.id, reason: "spam" }),
      },
      reporter.jar,
    );
    expect(resubmitResponse.status).toBe(201);

    const listResponse = await apiRequest(
      getServer().baseUrl,
      "/api/reports?status=pending",
      {},
      admin.jar,
    );
    expect(listResponse.status).toBe(200);
    const list = (await listResponse.json()) as { id: string; targetId: string }[];
    const report = list.find((item) => item.targetId === post.id);
    expect(report).toBeDefined();

    const resolveResponse = await apiRequest(
      getServer().baseUrl,
      `/api/reports/${report!.id}/resolve`,
      { method: "POST" },
      admin.jar,
    );
    expect(resolveResponse.status).toBe(200);

    const listAfterResolve = await apiRequest(
      getServer().baseUrl,
      "/api/reports?status=pending",
      {},
      admin.jar,
    );
    const pendingAfter = (await listAfterResolve.json()) as { id: string }[];
    expect(pendingAfter.find((item) => item.id === report!.id)).toBeUndefined();
  });
});
