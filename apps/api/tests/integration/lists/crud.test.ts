import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("lists CRUD", () => {
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

  it("requires auth to create a list", async () => {
    const response = await apiRequest(getServer().baseUrl, "/api/lists", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Unauthed list" }),
    });

    expect(response.status).toBe(401);
  });

  it("creates a list and fetches its detail", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "crud");

    const createResponse = await apiRequest(
      getServer().baseUrl,
      "/api/lists",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: "My Favorites",
          description: "A test list",
          isPublic: true,
          isRanked: false,
        }),
      },
      jar,
    );
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as { id: string; title: string };
    expect(created.title).toBe("My Favorites");

    const detailResponse = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${created.id}`,
    );
    expect(detailResponse.status).toBe(200);
    const detail = (await detailResponse.json()) as {
      id: string;
      itemCount: number;
      items: unknown[];
    };
    expect(detail.id).toBe(created.id);
    expect(detail.itemCount).toBe(0);
    expect(detail.items).toEqual([]);
  });

  it("returns 404 for a non-existent list", async () => {
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/lists/00000000-0000-0000-0000-000000000000",
    );
    expect(response.status).toBe(404);
  });

  it("rejects update/delete from a non-owner and allows the owner", async () => {
    const owner = await signUpTestUser(getServer().baseUrl, "own");
    const intruder = await signUpTestUser(getServer().baseUrl, "intr");

    const createResponse = await apiRequest(
      getServer().baseUrl,
      "/api/lists",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Owned list" }),
      },
      owner.jar,
    );
    const created = (await createResponse.json()) as { id: string };

    const forbiddenUpdate = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${created.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Hijacked" }),
      },
      intruder.jar,
    );
    expect(forbiddenUpdate.status).toBe(403);

    const forbiddenDelete = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${created.id}`,
      { method: "DELETE" },
      intruder.jar,
    );
    expect(forbiddenDelete.status).toBe(403);

    const ownerUpdate = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${created.id}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Renamed" }),
      },
      owner.jar,
    );
    expect(ownerUpdate.status).toBe(200);
    const updated = (await ownerUpdate.json()) as { title: string };
    expect(updated.title).toBe("Renamed");

    const ownerDelete = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${created.id}`,
      { method: "DELETE" },
      owner.jar,
    );
    expect(ownerDelete.status).toBe(200);

    const afterDelete = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${created.id}`,
    );
    expect(afterDelete.status).toBe(404);
  });

  it("returns 404 when updating/deleting a list that doesn't exist", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "ghost");
    const missingId = "00000000-0000-0000-0000-000000000000";

    const updateResponse = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${missingId}`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Nope" }),
      },
      jar,
    );
    expect(updateResponse.status).toBe(404);

    const deleteResponse = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${missingId}`,
      { method: "DELETE" },
      jar,
    );
    expect(deleteResponse.status).toBe(404);
  });
});
