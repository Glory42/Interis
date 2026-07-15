import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestMovie } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";
import { db } from "../../../src/infrastructure/database/db";
import { listEntries } from "../../../src/modules/lists/lists.entity";
import { MAX_LIST_ITEMS } from "../../../src/modules/lists/constants/lists.constants";

describe("list item cap", () => {
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

  it("rejects adding an item once a list is at MAX_LIST_ITEMS capacity", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "cap");

    const createResponse = await apiRequest(
      getServer().baseUrl,
      "/api/lists",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title: "Full list" }),
      },
      jar,
    );
    const list = (await createResponse.json()) as { id: string };

    // Seed straight into the DB rather than the API — filling a list to
    // MAX_LIST_ITEMS via real requests would itself trip the mutation rate
    // limiter (60/min) added in the security-hardening work.
    await db.insert(listEntries).values(
      Array.from({ length: MAX_LIST_ITEMS }, (_, i) => ({
        listId: list.id,
        itemType: "cinema",
        position: i + 1,
      })),
    );

    const movie = await seedTestMovie();
    const addResponse = await apiRequest(
      getServer().baseUrl,
      `/api/lists/${list.id}/items`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdbId: movie.tmdbId, itemType: "cinema" }),
      },
      jar,
    );
    expect(addResponse.status).toBe(400);
    const body = (await addResponse.json()) as { error: string };
    expect(body.error).toContain(String(MAX_LIST_ITEMS));
  });
});
