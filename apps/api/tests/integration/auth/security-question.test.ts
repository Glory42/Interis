import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { createCookieJar } from "../../support/app/cookie-jar";
import { startTestServer, type RunningTestServer } from "../../support/app/test-server";
import { buildAuthCredentials } from "../../support/factories/auth.factory";
import { AuthService } from "../../../src/modules/auth/auth.service";

describe("security question setup and password reset", () => {
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

  it("forgot-password returns a generic error for an unknown email", async () => {
    await expect(
      AuthService.getSecurityQuestionByEmail(`nobody-${randomUUID()}@example.com`),
    ).rejects.toThrow();
  });

  it("lets a user set a security question, then use it to reset their password", async () => {
    const auth = buildAuthCredentials("secq");
    const jar = createCookieJar();

    const signUpResponse = await apiRequest(
      getServer().baseUrl,
      "/api/auth/sign-up/email",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(auth),
      },
      jar,
    );
    expect(signUpResponse.ok).toBe(true);

    const meBefore = await apiRequest(getServer().baseUrl, "/api/users/me", {}, jar);
    expect((await meBefore.json() as { hasSecurityQuestion: boolean }).hasSecurityQuestion).toBe(
      false,
    );

    const question = "What is your favorite film?";
    const answer = "Paprika";

    const setQuestionResponse = await apiRequest(
      getServer().baseUrl,
      "/api/auth/security-question",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question, answer }),
      },
      jar,
    );
    expect(setQuestionResponse.ok).toBe(true);

    const meAfter = await apiRequest(getServer().baseUrl, "/api/users/me", {}, jar);
    expect((await meAfter.json() as { hasSecurityQuestion: boolean }).hasSecurityQuestion).toBe(
      true,
    );

    const lookupResponse = await apiRequest(getServer().baseUrl, "/api/auth/forgot-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: auth.email }),
    });
    expect(lookupResponse.ok).toBe(true);
    expect((await lookupResponse.json() as { question: string }).question).toBe(question);

    const wrongAnswerResponse = await apiRequest(
      getServer().baseUrl,
      "/api/auth/reset-password",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: auth.email, answer: "wrong answer", newPassword: "irrelevant123" }),
      },
    );
    expect(wrongAnswerResponse.status).toBe(401);

    const newPassword = "brand-new-password-1234";
    const resetResponse = await apiRequest(getServer().baseUrl, "/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      // Answer is case/whitespace-insensitive.
      body: JSON.stringify({ email: auth.email, answer: "  paprika  ", newPassword }),
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
  });

  it("requires a correct security answer to change email", async () => {
    const auth = buildAuthCredentials("secemail");
    const jar = createCookieJar();

    await apiRequest(
      getServer().baseUrl,
      "/api/auth/sign-up/email",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(auth),
      },
      jar,
    );

    const noQuestionResponse = await apiRequest(
      getServer().baseUrl,
      "/api/auth/change-email",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ newEmail: `changed-${randomUUID()}@example.com`, answer: "anything" }),
      },
      jar,
    );
    expect(noQuestionResponse.status).toBe(400);

    await apiRequest(
      getServer().baseUrl,
      "/api/auth/security-question",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: "Best director?", answer: "Miyazaki" }),
      },
      jar,
    );

    const wrongAnswerResponse = await apiRequest(
      getServer().baseUrl,
      "/api/auth/change-email",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ newEmail: `changed-${randomUUID()}@example.com`, answer: "wrong" }),
      },
      jar,
    );
    expect(wrongAnswerResponse.status).toBe(401);

    const newEmail = `changed-${randomUUID()}@example.com`;
    const correctAnswerResponse = await apiRequest(
      getServer().baseUrl,
      "/api/auth/change-email",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ newEmail, answer: "Miyazaki" }),
      },
      jar,
    );
    expect(correctAnswerResponse.ok).toBe(true);
    const correctAnswerBody = (await correctAnswerResponse.json()) as {
      user: { email: string };
    };
    expect(correctAnswerBody.user.email).toBe(newEmail);
  });

  it("admin can force-reset a password without a security question", async () => {
    const auth = buildAuthCredentials("adminrst");

    const signUpResponse = await apiRequest(getServer().baseUrl, "/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(auth),
    });
    expect(signUpResponse.ok).toBe(true);

    const newPassword = "admin-set-password-1234";
    await AuthService.adminResetPassword(auth.username, newPassword);

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
  });
});
