import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { promoteToAdmin } from "../../support/factories/admin.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("admin", () => {
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

  it("requires auth to list users", async () => {
    const response = await apiRequest(getServer().baseUrl, "/api/admin/users");
    expect(response.status).toBe(401);
  });

  it("rejects listing users for a non-admin", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "adma");

    const response = await apiRequest(getServer().baseUrl, "/api/admin/users", {}, jar);
    expect(response.status).toBe(403);
  });

  it("lets an admin list and search users", async () => {
    const admin = await signUpTestUser(getServer().baseUrl, "admb");
    await promoteToAdmin(admin.username);
    const target = await signUpTestUser(getServer().baseUrl, "admc");

    const listResponse = await apiRequest(
      getServer().baseUrl,
      "/api/admin/users",
      {},
      admin.jar,
    );
    expect(listResponse.status).toBe(200);
    const users = (await listResponse.json()) as { username: string }[];
    expect(users.some((u) => u.username === target.username)).toBe(true);

    const searchResponse = await apiRequest(
      getServer().baseUrl,
      `/api/admin/users?query=${target.username}`,
      {},
      admin.jar,
    );
    const searched = (await searchResponse.json()) as { username: string }[];
    expect(searched.map((u) => u.username)).toEqual([target.username]);
  });

  it("removes reported content and marks the report resolved", async () => {
    const admin = await signUpTestUser(getServer().baseUrl, "admd");
    await promoteToAdmin(admin.username);
    const postAuthor = await signUpTestUser(getServer().baseUrl, "adme");
    const reporter = await signUpTestUser(getServer().baseUrl, "admf");

    const createPost = await apiRequest(
      getServer().baseUrl,
      "/api/posts",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "offensive content" }),
      },
      postAuthor.jar,
    );
    const post = (await createPost.json()) as { id: string };

    const reportResponse = await apiRequest(
      getServer().baseUrl,
      "/api/reports",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetType: "post", targetId: post.id, reason: "inappropriate" }),
      },
      reporter.jar,
    );
    expect(reportResponse.status).toBe(201);

    const listResponse = await apiRequest(
      getServer().baseUrl,
      "/api/reports?status=pending",
      {},
      admin.jar,
    );
    const list = (await listResponse.json()) as { id: string; targetId: string }[];
    const report = list.find((item) => item.targetId === post.id);
    expect(report).toBeDefined();

    const removeResponse = await apiRequest(
      getServer().baseUrl,
      `/api/reports/${report!.id}/remove-content`,
      { method: "POST" },
      admin.jar,
    );
    expect(removeResponse.status).toBe(200);

    const postAfterRemoval = await apiRequest(getServer().baseUrl, `/api/posts/${post.id}`);
    expect(postAfterRemoval.status).toBe(404);

    const listAfterRemoval = await apiRequest(
      getServer().baseUrl,
      "/api/reports?status=pending",
      {},
      admin.jar,
    );
    const pendingAfter = (await listAfterRemoval.json()) as { id: string }[];
    expect(pendingAfter.find((item) => item.id === report!.id)).toBeUndefined();
  });
});
