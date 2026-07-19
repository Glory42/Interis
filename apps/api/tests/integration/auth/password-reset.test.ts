import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { buildAuthCredentials } from "../../support/factories/auth.factory";
import { db } from "../../../src/infrastructure/database/db";
import { credentials, passwordResetTokens } from "../../../src/infrastructure/database/auth.entity";
import { AuthService } from "../../../src/modules/auth/auth.service";
import { TokenService } from "../../../src/modules/auth/services/token.service";

describe("password reset / cutover flow", () => {
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

  it("does not throw for an unknown email (no user enumeration)", async () => {
    await expect(
      AuthService.requestPasswordReset(`nobody-${randomUUID()}@example.com`),
    ).resolves.toBeUndefined();
  });

  it("a cutover user (null password hash) fails login cleanly, then recovers via reset", async () => {
    const auth = buildAuthCredentials("cutover");

    const signUpResponse = await apiRequest(getServer().baseUrl, "/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(auth),
    });
    expect(signUpResponse.ok).toBe(true);
    const { user } = (await signUpResponse.json()) as { user: { id: string } };

    // Simulate the cutover backfill: strip the real hash, exactly as the
    // migration script leaves every pre-existing user.
    await db.update(credentials).set({ passwordHash: null }).where(eq(credentials.userId, user.id));

    const failedLogin = await apiRequest(getServer().baseUrl, "/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: auth.email, password: auth.password }),
    });
    expect(failedLogin.status).toBe(401);

    // Seed a reset token the same way AuthService.requestPasswordReset does
    // internally, without depending on a real email provider being
    // configured to retrieve the plaintext token.
    const plaintextToken = TokenService.generateOpaqueToken();
    await db.insert(passwordResetTokens).values({
      id: randomUUID(),
      userId: user.id,
      tokenHash: TokenService.hashOpaqueToken(plaintextToken),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const newPassword = "brand-new-password-1234";
    const resetResponse = await apiRequest(getServer().baseUrl, "/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: plaintextToken, newPassword }),
    });
    expect(resetResponse.ok).toBe(true);

    const oldPasswordLogin = await apiRequest(getServer().baseUrl, "/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: auth.email, password: auth.password }),
    });
    expect(oldPasswordLogin.status).toBe(401);

    const newPasswordLogin = await apiRequest(getServer().baseUrl, "/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: auth.email, password: newPassword }),
    });
    expect(newPasswordLogin.ok).toBe(true);

    // The reset token is single-use.
    const reuseResponse = await apiRequest(getServer().baseUrl, "/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token: plaintextToken, newPassword: "another-password-5678" }),
    });
    expect(reuseResponse.status).toBe(400);
  });
});
