import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestSerial } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("season and episode reviews", () => {
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

  it("creates, reads, and deletes a season review", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "seasrev");
    const serial = await seedTestSerial();

    const missingResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/review`,
      {},
      jar,
    );
    expect(missingResponse.status).toBe(200);
    expect(await missingResponse.json()).toBeNull();

    const upsertResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/review`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Great season.", containsSpoilers: false }),
      },
      jar,
    );
    expect(upsertResponse.status).toBe(200);
    const upserted = (await upsertResponse.json()) as { content: string };
    expect(upserted.content).toBe("Great season.");

    const getResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/review`,
      {},
      jar,
    );
    const fetched = (await getResponse.json()) as { content: string };
    expect(fetched.content).toBe("Great season.");

    const deleteResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/review`,
      { method: "DELETE" },
      jar,
    );
    expect(deleteResponse.status).toBe(200);

    const afterDeleteResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/review`,
      {},
      jar,
    );
    expect(await afterDeleteResponse.json()).toBeNull();
  });

  it("creates, reads, and deletes an episode review", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "eprev");
    const serial = await seedTestSerial();

    const upsertResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/episodes/1/review`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Great episode.", containsSpoilers: true }),
      },
      jar,
    );
    expect(upsertResponse.status).toBe(200);
    const upserted = (await upsertResponse.json()) as {
      content: string;
      containsSpoilers: boolean;
    };
    expect(upserted.content).toBe("Great episode.");
    expect(upserted.containsSpoilers).toBe(true);

    const deleteResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/episodes/1/review`,
      { method: "DELETE" },
      jar,
    );
    expect(deleteResponse.status).toBe(200);

    const missingDeleteResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/episodes/1/review`,
      { method: "DELETE" },
      jar,
    );
    expect(missingDeleteResponse.status).toBe(404);
  });

  it("requires auth for season and episode review endpoints", async () => {
    const serial = await seedTestSerial();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/seasons/1/review`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: "Nope" }),
      },
    );
    expect(response.status).toBe(401);
  });
});
