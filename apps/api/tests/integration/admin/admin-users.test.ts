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
          body: JSON.stringify({}),
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
          body: JSON.stringify({ reason: "test suspension" }),
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
      const promoteResponse = await apiRequest(
        getServer().baseUrl,
        "/api/admin/users/no-such-user-xyz/promote",
        { method: "POST" },
        admin.jar,
      );
      expect(promoteResponse.status).toBe(400);

      const demoteResponse = await apiRequest(
        getServer().baseUrl,
        "/api/admin/users/no-such-user-xyz/demote",
        { method: "POST" },
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

      const promoteResponse = await apiRequest(
        getServer().baseUrl,
        `/api/admin/users/${target.username}/promote`,
        { method: "POST" },
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

      const demoteResponse = await apiRequest(
        getServer().baseUrl,
        `/api/admin/users/${target.username}/demote`,
        { method: "POST" },
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
        { method: "DELETE" },
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
