import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { promoteToAdmin } from "../../support/factories/admin.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("admin community actions", () => {
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

  describe("lists", () => {
    it("lists and deletes a user's list", async () => {
      const admin = await makeAdmin("acomadmin1");
      const owner = await signUpTestUser(getServer().baseUrl, "acomlistowner");

      const createResponse = await apiRequest(
        getServer().baseUrl,
        "/api/lists",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title: "Community List" }),
        },
        owner.jar,
      );
      const list = (await createResponse.json()) as { id: string };

      const listResponse = await apiRequest(
        getServer().baseUrl,
        `/api/admin/lists?username=${owner.username}`,
        {},
        admin.jar,
      );
      expect(listResponse.status).toBe(200);
      const lists = (await listResponse.json()) as Array<{ id: string }>;
      expect(lists.some((l) => l.id === list.id)).toBe(true);

      const deleteResponse = await apiRequest(
        getServer().baseUrl,
        `/api/admin/lists/${list.id}`,
        { method: "DELETE" },
        admin.jar,
      );
      expect(deleteResponse.status).toBe(200);

      const detailResponse = await apiRequest(getServer().baseUrl, `/api/lists/${list.id}`);
      expect(detailResponse.status).toBe(404);
    });

    it("returns 404 deleting a non-existent list", async () => {
      const admin = await makeAdmin("acomlistghost");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/admin/lists/00000000-0000-0000-0000-000000000000",
        { method: "DELETE" },
        admin.jar,
      );
      expect(response.status).toBe(404);
    });
  });

  describe("activities", () => {
    it("lists and deletes a user's activity", async () => {
      const admin = await makeAdmin("acomadmin2");
      const author = await signUpTestUser(getServer().baseUrl, "acomactivityauthor");

      const postResponse = await apiRequest(
        getServer().baseUrl,
        "/api/posts",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: "Community activity post" }),
        },
        author.jar,
      );
      expect(postResponse.status).toBe(201);

      const listResponse = await apiRequest(
        getServer().baseUrl,
        `/api/admin/activities?username=${author.username}&type=post`,
        {},
        admin.jar,
      );
      expect(listResponse.status).toBe(200);
      const activities = (await listResponse.json()) as Array<{ id: string; type: string }>;
      expect(activities.length).toBeGreaterThanOrEqual(1);
      expect(activities.every((a) => a.type === "post")).toBe(true);

      const activityId = activities[0]!.id;
      const deleteResponse = await apiRequest(
        getServer().baseUrl,
        `/api/admin/activities/${activityId}`,
        { method: "DELETE" },
        admin.jar,
      );
      expect(deleteResponse.status).toBe(200);
    });

    it("returns 404 deleting a non-existent activity", async () => {
      const admin = await makeAdmin("acomactivityghost");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/admin/activities/00000000-0000-0000-0000-000000000000",
        { method: "DELETE" },
        admin.jar,
      );
      expect(response.status).toBe(404);
    });

    it("rejects an invalid activity type filter", async () => {
      const admin = await makeAdmin("acomactivitybadtype");
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/admin/activities?type=not_a_real_type",
        {},
        admin.jar,
      );
      expect(response.status).toBe(400);
    });
  });
});
