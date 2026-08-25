import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";
import { getTrustedOriginsFromEnv } from "../../../src/infrastructure/config/origins";

describe("CORS + CSRF origin enforcement", () => {
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

  it("rejects any request from an untrusted Origin", async () => {
    const response = await apiRequest(getServer().baseUrl, "/api/health", {
      headers: { origin: "https://evil.example.com" },
    });

    expect(response.status).toBe(403);
  });

  it("rejects a mutation with an untrusted Origin (blocked by the CORS layer)", async () => {
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/__no_such_route__",
      {
        method: "POST",
        headers: {
          origin: "https://evil.example.com",
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );

    expect(response.status).toBe(403);
    const body = (await response.json()) as { error: { message: string; code: string } };
    expect(body.error.message).toBe("Origin is not allowed");
    expect(body.error.code).toBe("CORS_NOT_ALLOWED");
  });

  it("rejects a mutation with no Origin but an untrusted Referer", async () => {
    // No Origin header means it clears the generic CORS layer — this
    // exercises requireTrustedOriginForMutations' Referer fallback, which
    // the CORS middleware alone does not check.
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/__no_such_route__",
      {
        method: "POST",
        headers: {
          referer: "https://evil.example.com/attack-page",
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );

    expect(response.status).toBe(403);
    const body = (await response.json()) as { error: { message: string; code: string } };
    expect(body.error.message).toBe("Invalid origin");
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("allows a mutation from a trusted Origin to reach routing", async () => {
    const [trustedOrigin] = getTrustedOriginsFromEnv();
    if (!trustedOrigin) {
      throw new Error("No trusted origins configured");
    }

    const response = await apiRequest(
      getServer().baseUrl,
      "/api/__no_such_route__",
      {
        method: "POST",
        headers: {
          origin: trustedOrigin,
          "content-type": "application/json",
        },
        body: JSON.stringify({}),
      },
    );

    // Not 403 — origin was accepted, request just hit no matching route.
    expect(response.status).not.toBe(403);
  });
});
