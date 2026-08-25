import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { z } from "zod";
import { apiRequest } from "../support/app/http-client";
import { signUpTestUser } from "../support/app/auth-flow";
import {
  startTestServer,
  type RunningTestServer,
} from "../support/app/test-server";

const notificationItemSchema = z
  .object({
    id: z.string(),
    actorId: z.string(),
    actorUsername: z.string(),
    actorDisplayUsername: z.string().nullable(),
    actorAvatarUrl: z.string().nullable(),
    type: z.enum([
      "follow",
      "like_review",
      "like_post",
      "like_activity",
      "comment_review",
      "comment_post",
    ]),
    entityId: z.string(),
    metadata: z.string().nullable(),
    isRead: z.boolean(),
    createdAt: z.string(),
  })
  .strict();

const notificationPageSchema = z
  .object({
    items: z.array(notificationItemSchema),
    nextCursor: z.string().nullable(),
  })
  .strict();

const unreadCountSchema = z.object({ count: z.number() }).strict();

describe("notifications contract", () => {
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

  it("list page matches the schema", async () => {
    const a = await signUpTestUser(getServer().baseUrl, "cna");
    const b = await signUpTestUser(getServer().baseUrl, "cnb");

    await apiRequest(
      getServer().baseUrl,
      `/api/social/follow/${a.username}`,
      { method: "POST" },
      b.jar,
    );

    const response = await apiRequest(
      getServer().baseUrl,
      "/api/notifications",
      {},
      a.jar,
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(notificationPageSchema.safeParse(body).success).toBe(true);
  });

  it("unread count matches the schema", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "cnc");

    const response = await apiRequest(
      getServer().baseUrl,
      "/api/notifications/unread-count",
      {},
      jar,
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(unreadCountSchema.safeParse(body).success).toBe(true);
  });
});
