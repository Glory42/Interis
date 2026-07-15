import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("security headers", () => {
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

  it("sets Helmet + Permissions-Policy headers on every response", async () => {
    const response = await apiRequest(getServer().baseUrl, "/api/health");

    expect(response.headers.get("x-content-type-options")).toBe("nosniff");
    expect(response.headers.get("x-frame-options")).toBe("DENY");
    expect(response.headers.get("strict-transport-security")).toContain(
      "max-age=31536000",
    );
    expect(response.headers.get("content-security-policy")).toContain(
      "default-src 'none'",
    );
    expect(response.headers.get("permissions-policy")).toContain(
      "camera=()",
    );
    expect(response.headers.get("x-powered-by")).toBeNull();
  });
});
