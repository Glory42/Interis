import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { resolveTrustProxy } from "../../../src/infrastructure/config/trust-proxy";

// The test client connects over loopback, standing in for Render's load balancer;
// each X-Forwarded-For below is what that proxy would hand the app.
describe("trust proxy", () => {
  const API_LIMIT = 2;
  let testServer: RunningTestServer | null = null;

  beforeAll(async () => {
    testServer = await startTestServer({ rateLimiterOverrides: { api: API_LIMIT }, trustProxy: "cloudflare" });
  });

  afterAll(async () => {
    await testServer?.close();
    testServer = null;
  });

  const hit = (forwardedFor: string) =>
    fetch(`${testServer!.baseUrl}/api/health`, { headers: { "x-forwarded-for": forwardedFor } }).then(
      (response) => response.status,
    );

  it("keys a direct client by its own address, whatever it writes into X-Forwarded-For", async () => {
    const statuses = [];
    for (const spoofed of ["10.9.9.1", "198.51.100.1", "104.16.0.9"]) {
      statuses.push(await hit(`${spoofed}, 203.0.113.10`));
    }
    expect(statuses).toEqual([200, 200, 429]);
  });

  it("keys a request through Cloudflare by the visitor, not the Cloudflare edge", async () => {
    expect(await hit("203.0.113.20, 104.16.0.1")).toBe(200);
    expect(await hit("spoof, 203.0.113.20, 172.64.0.7")).toBe(200);
    expect(await hit("203.0.113.20, 162.158.1.1")).toBe(429);
    // A different visitor behind the same edge has its own bucket.
    expect(await hit("203.0.113.21, 104.16.0.1")).toBe(200);
  });
});

describe("resolveTrustProxy", () => {
  it("refuses blanket trust and parses the other forms", () => {
    expect(() => resolveTrustProxy("true")).toThrow();
    expect(resolveTrustProxy("none")).toBe(false);
    expect(resolveTrustProxy("2")).toBe(2);
    expect(resolveTrustProxy("loopback, 10.0.0.0/8")).toEqual(["loopback", "10.0.0.0/8"]);
    expect(resolveTrustProxy("cloudflare")).toContain("104.16.0.0/13");
  });
});
