import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { promoteToAdmin } from "../../support/factories/admin.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("admin user actions", () => {
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

  const makeAdmin = async (prefix: string) => {
    const admin = await signUpTestUser(getServer().baseUrl, prefix);
    await promoteToAdmin(admin.username);
    return admin;
  };

  const postJson = (path: string, body: unknown, jar: Parameters<typeof apiRequest>[3]) =>
    apiRequest(
      getServer().baseUrl,
      path,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      },
      jar,
    );

  const signIn = (email: string, password: string) =>
    postJson("/api/auth/sign-in/email", { email, password }, undefined);

  describe("admin password", () => {
    it("rejects a password reset without the admin's password and keeps the old one", async () => {
      const admin = await makeAdmin("aurpnopw");
      const target = await signUpTestUser(getServer().baseUrl, "aurpnopwt");

      const response = await postJson(
        `/api/admin/users/${target.username}/reset-password`,
        { newPassword: "hijacked-password-1234" },
        admin.jar,
      );
      expect(response.status).toBe(401);

      const oldLogin = await signIn(target.email, target.password);
      expect(oldLogin.ok).toBe(true);
    });

    it("rejects resetting your own password through admin", async () => {
      const admin = await makeAdmin("aurpself");

      const response = await postJson(
        `/api/admin/users/${admin.username}/reset-password`,
        { newPassword: "self-reset-password-1234", adminPassword: admin.password },
        admin.jar,
      );
      expect(response.status).toBe(400);

      const oldLogin = await signIn(admin.email, admin.password);
      expect(oldLogin.ok).toBe(true);
    });

    it("rejects promoting your own account", async () => {
      const admin = await makeAdmin("aupromoself");

      const response = await postJson(
        `/api/admin/users/${admin.username}/promote`,
        { adminPassword: admin.password },
        admin.jar,
      );
      expect(response.status).toBe(400);
    });

    it("rejects a suspension with a wrong admin password and leaves the user active", async () => {
      const admin = await makeAdmin("aususpw");
      const target = await signUpTestUser(getServer().baseUrl, "aususpwt");

      const response = await postJson(
        `/api/admin/users/${target.username}/suspend`,
        { reason: "nope", adminPassword: "not-the-admin-password" },
        admin.jar,
      );
      expect(response.status).toBe(401);

      const me = await apiRequest(getServer().baseUrl, "/api/users/me", {}, target.jar);
      expect(me.status).toBe(200);
    });

    it("rejects a promotion with a wrong admin password and grants no admin access", async () => {
      const admin = await makeAdmin("aupropw");
      const target = await signUpTestUser(getServer().baseUrl, "aupropwt");

      const response = await postJson(
        `/api/admin/users/${target.username}/promote`,
        { adminPassword: "not-the-admin-password" },
        admin.jar,
      );
      expect(response.status).toBe(401);

      const adminList = await apiRequest(getServer().baseUrl, "/api/admin/users", {}, target.jar);
      expect(adminList.status).toBe(403);
    });

    it("rejects a demotion with a wrong admin password and keeps admin access", async () => {
      const admin = await makeAdmin("audempw");
      const target = await makeAdmin("audempwt");

      const response = await postJson(
        `/api/admin/users/${target.username}/demote`,
        { adminPassword: "not-the-admin-password" },
        admin.jar,
      );
      expect(response.status).toBe(401);

      const adminList = await apiRequest(getServer().baseUrl, "/api/admin/users", {}, target.jar);
      expect(adminList.status).toBe(200);
    });

    it("rejects a deletion with a wrong admin password and keeps the account", async () => {
      const admin = await makeAdmin("audelpw");
      const target = await signUpTestUser(getServer().baseUrl, "audelpwt");

      const response = await apiRequest(
        getServer().baseUrl,
        `/api/admin/users/${target.username}`,
        {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ adminPassword: "not-the-admin-password" }),
        },
        admin.jar,
      );
      expect(response.status).toBe(401);

      const login = await signIn(target.email, target.password);
      expect(login.ok).toBe(true);
    });
  });

  describe("suspend/unsuspend", () => {
    it("rejects suspending your own account", async () => {
      const admin = await makeAdmin("ausself");
      const response = await apiRequest(
        getServer().baseUrl,
        `/api/admin/users/${admin.username}/suspend`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        },
        admin.jar,
      );
      expect(response.status).toBe(400);
    });

    it("returns 400 suspending an unknown username", async () => {
      const admin = await makeAdmin("ausghost");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/admin/users/no-such-user-xyz/suspend",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ adminPassword: admin.password }),
        },
        admin.jar,
      );
      expect(response.status).toBe(400);
    });

    it("suspends a user, blocking their subsequent requests, then unsuspends them", async () => {
      const admin = await makeAdmin("ausadmin");
      const target = await signUpTestUser(getServer().baseUrl, "austarget");

      const suspendResponse = await apiRequest(
        getServer().baseUrl,
        `/api/admin/users/${target.username}/suspend`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reason: "test suspension", adminPassword: admin.password }),
        },
        admin.jar,
      );
      expect(suspendResponse.status).toBe(200);

      const blockedResponse = await apiRequest(
        getServer().baseUrl,
        "/api/users/me",
        {},
        target.jar,
      );
      expect(blockedResponse.status).toBe(403);

      const unsuspendResponse = await apiRequest(
        getServer().baseUrl,
        `/api/admin/users/${target.username}/unsuspend`,
        { method: "POST" },
        admin.jar,
      );
      expect(unsuspendResponse.status).toBe(200);

      const restoredResponse = await apiRequest(
        getServer().baseUrl,
        "/api/users/me",
        {},
        target.jar,
      );
      expect(restoredResponse.status).toBe(200);
    });
  });

  describe("promote/demote", () => {
    it("rejects demoting your own account", async () => {
      const admin = await makeAdmin("audemoself");
      const response = await apiRequest(
        getServer().baseUrl,
        `/api/admin/users/${admin.username}/demote`,
        { method: "POST" },
        admin.jar,
      );
      expect(response.status).toBe(400);
    });

    it("returns 400 promoting/demoting an unknown username", async () => {
      const admin = await makeAdmin("aughostpromo");
      const promoteResponse = await postJson(
        "/api/admin/users/no-such-user-xyz/promote",
        { adminPassword: admin.password },
        admin.jar,
      );
      expect(promoteResponse.status).toBe(400);

      const demoteResponse = await postJson(
        "/api/admin/users/no-such-user-xyz/demote",
        { adminPassword: admin.password },
        admin.jar,
      );
      expect(demoteResponse.status).toBe(400);
    });

    it("promotes a user to admin, granting admin access, then demotes them", async () => {
      const admin = await makeAdmin("aupromoadmin");
      const target = await signUpTestUser(getServer().baseUrl, "aupromotarget");

      const beforePromote = await apiRequest(
        getServer().baseUrl,
        "/api/admin/users",
        {},
        target.jar,
      );
      expect(beforePromote.status).toBe(403);

      const promoteResponse = await postJson(
        `/api/admin/users/${target.username}/promote`,
        { adminPassword: admin.password },
        admin.jar,
      );
      expect(promoteResponse.status).toBe(200);

      const afterPromote = await apiRequest(
        getServer().baseUrl,
        "/api/admin/users",
        {},
        target.jar,
      );
      expect(afterPromote.status).toBe(200);

      const demoteResponse = await postJson(
        `/api/admin/users/${target.username}/demote`,
        { adminPassword: admin.password },
        admin.jar,
      );
      expect(demoteResponse.status).toBe(200);

      const afterDemote = await apiRequest(
        getServer().baseUrl,
        "/api/admin/users",
        {},
        target.jar,
      );
      expect(afterDemote.status).toBe(403);
    });
  });

  describe("delete", () => {
    it("rejects deleting your own account", async () => {
      const admin = await makeAdmin("audelself");
      const response = await apiRequest(
        getServer().baseUrl,
        `/api/admin/users/${admin.username}`,
        { method: "DELETE" },
        admin.jar,
      );
      expect(response.status).toBe(400);
    });

    it("deletes a user, invalidating their session", async () => {
      const admin = await makeAdmin("audeladmin");
      const target = await signUpTestUser(getServer().baseUrl, "audeltarget");

      const deleteResponse = await apiRequest(
        getServer().baseUrl,
        `/api/admin/users/${target.username}`,
        {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ adminPassword: admin.password }),
        },
        admin.jar,
      );
      expect(deleteResponse.status).toBe(200);

      const afterDelete = await apiRequest(getServer().baseUrl, "/api/users/me", {}, target.jar);
      expect([401, 403]).toContain(afterDelete.status);

      const listResponse = await apiRequest(
        getServer().baseUrl,
        `/api/admin/users?query=${target.username}`,
        {},
        admin.jar,
      );
      const users = (await listResponse.json()) as Array<{ username: string }>;
      expect(users.some((u) => u.username === target.username)).toBe(false);
    });
  });
});

describe("admin password attempts are rate limited", () => {
  let testServer: RunningTestServer | null = null;

  beforeAll(async () => {
    testServer = await startTestServer({ rateLimiterOverrides: { adminReauth: 2 } });
  });

  afterAll(async () => {
    if (!testServer) return;
    await testServer.close();
    testServer = null;
  });

  it("refuses further attempts after repeated wrong admin passwords", async () => {
    const baseUrl = testServer!.baseUrl;
    const admin = await signUpTestUser(baseUrl, "aurlimit");
    await promoteToAdmin(admin.username);
    const target = await signUpTestUser(baseUrl, "aurlimitt");

    const attempt = () =>
      apiRequest(
        baseUrl,
        `/api/admin/users/${target.username}/suspend`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ adminPassword: "guess-1234" }),
        },
        admin.jar,
      );

    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(401);
    expect((await attempt()).status).toBe(429);
  });
});
