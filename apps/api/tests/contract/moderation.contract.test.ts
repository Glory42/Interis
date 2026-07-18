import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { z } from "zod";
import { apiRequest } from "../support/app/http-client";
import { signUpTestUser } from "../support/app/auth-flow";
import {
  startTestServer,
  type RunningTestServer,
} from "../support/app/test-server";

const relationshipStateSchema = z
  .object({
    isBlocked: z.boolean(),
    isMuted: z.boolean(),
  })
  .strict();

const moderatedUserSchema = z
  .object({
    id: z.string(),
    username: z.string(),
    displayUsername: z.string().nullable(),
    image: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    createdAt: z.string(),
  })
  .strict();

describe("moderation contract", () => {
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

  it("relationship state matches the schema", async () => {
    const a = await signUpTestUser(getServer().baseUrl, "cma");
    const b = await signUpTestUser(getServer().baseUrl, "cmb");

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/moderation/state/${b.username}`,
      {},
      a.jar,
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(relationshipStateSchema.safeParse(body).success).toBe(true);
  });

  it("blocked-users list items match the schema", async () => {
    const a = await signUpTestUser(getServer().baseUrl, "cmc");
    const b = await signUpTestUser(getServer().baseUrl, "cmd");

    await apiRequest(
      getServer().baseUrl,
      `/api/moderation/block/${b.username}`,
      { method: "POST" },
      a.jar,
    );

    const response = await apiRequest(
      getServer().baseUrl,
      "/api/moderation/blocked",
      {},
      a.jar,
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    const result = z.array(moderatedUserSchema).safeParse(body);
    expect(result.success).toBe(true);
  });
});
