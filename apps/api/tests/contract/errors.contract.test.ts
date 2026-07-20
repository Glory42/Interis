import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { z } from "zod";
import { apiRequest } from "../support/app/http-client";
import { signUpTestUser } from "../support/app/auth-flow";
import {
  startTestServer,
  type RunningTestServer,
} from "../support/app/test-server";

// Locks in the unified error envelope { error: { message, code, details? } }
// - a regression here breaks every frontend consumer of ApiError at once,
// worth guarding as a contract rather than re-deriving per integration test.
const errorEnvelopeSchema = z
  .object({
    error: z
      .object({
        message: z.string(),
        code: z.string(),
        details: z.unknown().optional(),
      })
      .strict(),
  })
  .strict();

describe("error response contract", () => {
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

  it("matches the envelope on 404", async () => {
    // Stays within int32 range (movies.tmdbId is a Postgres integer column)
    // so this exercises the not-found path, not an out-of-range DB error.
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/movies/999999999",
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(errorEnvelopeSchema.safeParse(body).success).toBe(true);
  });

  it("matches the envelope on 401", async () => {
    const response = await apiRequest(getServer().baseUrl, "/api/notifications");
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(errorEnvelopeSchema.safeParse(body).success).toBe(true);
  });

  it("matches the envelope on 400 validation errors", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "cterr");

    const response = await apiRequest(
      getServer().baseUrl,
      "/api/reports",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetType: "not-a-real-type" }),
      },
      jar,
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(errorEnvelopeSchema.safeParse(body).success).toBe(true);
  });
});
