import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("rate limiting", () => {
  let testServer: RunningTestServer | null = null;

  const getServer = (): RunningTestServer => {
    if (!testServer) {
      throw new Error("Test server is not running");
    }

    return testServer;
  };

  beforeAll(async () => {
    // These tests exercise the real production ceilings, not the relaxed
    // NODE_ENV=test defaults every other integration test file relies on.
    testServer = await startTestServer({
      rateLimiterOverrides: { auth: 30, mutation: 60 },
    });
  });

  afterAll(async () => {
    if (!testServer) {
      return;
    }

    await testServer.close();
    testServer = null;
  });

  it("returns 429 once the auth limiter's ceiling (30/min) is exceeded", async () => {
    const statuses: number[] = [];

    for (let i = 0; i < 31; i += 1) {
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/auth/get-session",
      );
      statuses.push(response.status);
    }

    expect(statuses.at(-1)).toBe(429);
  });

  it("returns 429 once the mutation limiter's ceiling (60/min) is exceeded", async () => {
    const statuses: number[] = [];

    for (let i = 0; i < 61; i += 1) {
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/__no_such_mutation_route__",
        { method: "POST" },
      );
      statuses.push(response.status);
    }

    expect(statuses.at(-1)).toBe(429);
  });
});
