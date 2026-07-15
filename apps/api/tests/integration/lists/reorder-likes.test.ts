import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestMovie } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("list reorder + likes", () => {
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

  it("reorders items and rejects entries that don't belong to the list", async () => {
    const owner = await signUpTestUser(getServer().baseUrl, "reord");
    const listResponse = await apiRequest(
      getServer().baseUrl,
      "/api/lists",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Reorder me", isRanked: true }),
      },
      owner.jar,
    );
    const list = (await listResponse.json()) as { id: string };

    const movieA = await seedTestMovie("A");
    const movieB = await seedTestMovie("B");

    const addEntry = async (tmdbId: number) => {
      const response = await apiRequest(
        getServer().baseUrl,
        `/api/lists/${list.id}/items`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ tmdbId, itemType: "cinema" }),
        },
        owner.jar,
      );
      const body = (await response.json()) as { entry: { id: string } };
      return body.entry.id;
    };

    const entryAId = await addEntry(movieA.tmdbId);
    const entryBId = await addEntry(movieB.tmdbId);

    const reorderResponse = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${list.id}/reorder`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: [
            { id: entryBId, position: 1 },
            { id: entryAId, position: 2 },
          ],
        }),
      },
      owner.jar,
    );
    expect(reorderResponse.status).toBe(200);

    const detail = await apiRequest(getServer().baseUrl, `/api/lists/${list.id}`);
    const detailBody = (await detail.json()) as { items: Array<{ id: string }> };
    expect(detailBody.items.map((i) => i.id)).toEqual([entryBId, entryAId]);

    const foreignReorder = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${list.id}/reorder`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: [{ id: "00000000-0000-0000-0000-000000000000", position: 1 }],
        }),
      },
      owner.jar,
    );
    expect(foreignReorder.status).toBe(403);
  });

  it("likes and unlikes a public list, and rejects liking a private list you don't own", async () => {
    const owner = await signUpTestUser(getServer().baseUrl, "likeo");
    const liker = await signUpTestUser(getServer().baseUrl, "liker");

    const publicListResponse = await apiRequest(
      getServer().baseUrl,
      "/api/lists",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Public list", isPublic: true }),
      },
      owner.jar,
    );
    const publicList = (await publicListResponse.json()) as { id: string };

    const likeResponse = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${publicList.id}/like`,
      { method: "POST" },
      liker.jar,
    );
    expect(likeResponse.status).toBe(200);
    const likeBody = (await likeResponse.json()) as { likeCount: number };
    expect(likeBody.likeCount).toBe(1);

    const unlikeResponse = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${publicList.id}/like`,
      { method: "DELETE" },
      liker.jar,
    );
    expect(unlikeResponse.status).toBe(200);
    const unlikeBody = (await unlikeResponse.json()) as { likeCount: number };
    expect(unlikeBody.likeCount).toBe(0);

    const privateListResponse = await apiRequest(
      getServer().baseUrl,
      "/api/lists",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Private list", isPublic: false }),
      },
      owner.jar,
    );
    const privateList = (await privateListResponse.json()) as { id: string };

    const forbiddenLike = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${privateList.id}/like`,
      { method: "POST" },
      liker.jar,
    );
    expect(forbiddenLike.status).toBe(403);
  });
});
