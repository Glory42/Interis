import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("request body size limits", () => {
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
    if (!testServer) {
      return;
    }

    await testServer.close();
    testServer = null;
  });

  it("rejects an oversized auth payload with 413", async () => {
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/auth/sign-up/email",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ padding: "x".repeat(25_000) }),
      },
    );

    expect(response.status).toBe(413);
  });

  it("rejects an oversized general JSON payload with 413", async () => {
    const response = await apiRequest(getServer().baseUrl, "/api/reviews", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ padding: "x".repeat(1_100_000) }),
    });

    expect(response.status).toBe(413);
  });
});
