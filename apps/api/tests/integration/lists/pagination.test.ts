import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("GET /api/users/:username/lists pagination", () => {
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

  it("bounds the collection with limit/offset instead of returning everything", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "page");

    for (const title of ["List 1", "List 2", "List 3"]) {
      const response = await apiRequest(
        getServer().baseUrl,
        "/api/lists",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ title }),
        },
        jar,
      );
      expect(response.status).toBe(201);
    }

    const allResponse = await apiRequest(
      getServer().baseUrl,
      `/api/users/${username}/lists`,
      {},
      jar,
    );
    const all = (await allResponse.json()) as unknown[];
    expect(all.length).toBe(3);

    const firstPage = await apiRequest(
      getServer().baseUrl,
      `/api/users/${username}/lists?limit=2`,
      {},
      jar,
    );
    const firstPageBody = (await firstPage.json()) as unknown[];
    expect(firstPageBody.length).toBe(2);

    const secondPage = await apiRequest(
      getServer().baseUrl,
      `/api/users/${username}/lists?limit=2&offset=2`,
      {},
      jar,
    );
    const secondPageBody = (await secondPage.json()) as unknown[];
    expect(secondPageBody.length).toBe(1);
  });

  it("falls back to the default page size instead of erroring on an out-of-range limit", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "pgmax");

    const createResponse = await apiRequest(
      getServer().baseUrl,
      "/api/lists",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Only list" }),
      },
      jar,
    );
    expect(createResponse.status).toBe(201);

    // limit=1000 exceeds ProfileListQuerySchema's max(100) — the shared
    // parseProfileListPagination helper treats that as invalid and falls
    // back to the default page size rather than rejecting the request.
    const response = await apiRequest(
      getServer().baseUrl,
      `/api/users/${username}/lists?limit=1000`,
      {},
      jar,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as unknown[];
    expect(body.length).toBe(1);
  });
});
