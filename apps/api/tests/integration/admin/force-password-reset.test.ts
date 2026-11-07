import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser, type SignedUpTestUser } from "../../support/app/auth-flow";
import type { CookieJar } from "../../support/app/cookie-jar";
import { promoteToAdmin } from "../../support/factories/admin.factory";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";

describe("force password reset", () => {
  let testServer: RunningTestServer | null = null;

  const getServer = (): RunningTestServer => {
    if (!testServer) throw new Error("Test server is not running");
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

  const post = (path: string, body: unknown, jar?: CookieJar) =>
    apiRequest(
      getServer().baseUrl,
      path,
      { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) },
      jar,
    );
  const get = (path: string, jar: CookieJar) => apiRequest(getServer().baseUrl, path, {}, jar);
  const signIn = (target: SignedUpTestUser, password: string) =>
    post("/api/auth/sign-in/email", { email: target.email, password });

  const setup = async (prefix: string, withQuestion: boolean) => {
    const admin = await signUpTestUser(getServer().baseUrl, `${prefix}a`);
    await promoteToAdmin(admin.username);
    const target = await signUpTestUser(getServer().baseUrl, `${prefix}t`);
    if (withQuestion) {
      const saved = await post("/api/auth/security-question", { question: "First film?", answer: "godzilla" }, target.jar);
      expect(saved.ok).toBe(true);
    }
    return { admin, target, path: `/api/admin/users/${target.username}/force-password-reset` };
  };

  it("signs the user out and sends them through their recovery question", async () => {
    const { admin, target, path } = await setup("fpr", true);

    expect((await post(path, {}, admin.jar)).status).toBe(401);
    expect((await post(path, { adminPassword: admin.password }, admin.jar)).status).toBe(200);
    expect((await get("/api/users/me", target.jar)).status).toBe(401);

    const blocked = await signIn(target, target.password);
    expect(blocked.status).toBe(403);
    expect(((await blocked.json()) as { error: { code: string } }).error.code).toBe("PASSWORD_RESET_REQUIRED");

    const reset = await post("/api/auth/reset-password", {
      email: target.email,
      answer: "godzilla",
      newPassword: "a-brand-new-password-42",
    });
    expect(reset.status).toBe(200);
    expect((await signIn(target, "a-brand-new-password-42")).status).toBe(200);

    const audit = (await (await get(`/api/admin/audit?actor=${admin.username}`, admin.jar)).json()) as {
      items: { action: string; targetLabel: string | null }[];
    };
    expect(audit.items[0]).toMatchObject({ action: "user.force_password_reset", targetLabel: target.username });
  });

  it("refuses when the user has no recovery question, leaving them signed in", async () => {
    const { admin, target, path } = await setup("fprnq", false);

    expect((await post(path, { adminPassword: admin.password }, admin.jar)).status).toBe(409);
    expect((await get("/api/users/me", target.jar)).status).toBe(200);
  });

  it("shows whether a reset is pending and whether recovery is possible", async () => {
    const { admin, target, path } = await setup("fprd", true);
    await post(path, { adminPassword: admin.password }, admin.jar);

    const detail = (await (await get(`/api/admin/users/${target.username}`, admin.jar)).json()) as {
      user: { mustChangePassword: boolean; hasRecoveryQuestion: boolean };
    };
    expect(detail.user).toMatchObject({ mustChangePassword: true, hasRecoveryQuestion: true });
  });

  it("won't force a reset on your own account", async () => {
    const admin = await signUpTestUser(getServer().baseUrl, "fprself");
    await promoteToAdmin(admin.username);
    const response = await post(
      `/api/admin/users/${admin.username}/force-password-reset`,
      { adminPassword: admin.password },
      admin.jar,
    );
    expect(response.status).toBe(400);
  });
});
