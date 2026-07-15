import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestSerial } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("serials diary logs", () => {
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

  it("requires auth to create a log", async () => {
    const serial = await seedTestSerial();
    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/log`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watchedDate: "2026-01-01" }),
      },
    );
    expect(response.status).toBe(401);
  });

  it("creates a log with a review and surfaces it in both 'my logs' and the series' logs", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "dlog");
    const serial = await seedTestSerial("Diary Test Serial");

    const createResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/log`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          watchedDate: "2026-01-01",
          rating: 7.5,
          rewatch: false,
          review: "Pretty good.",
          containsSpoilers: false,
        }),
      },
      jar,
    );
    expect(createResponse.status).toBe(201);
    const created = (await createResponse.json()) as {
      entry: { id: string; watchedDate: string; rating: number };
      series: { tmdbId: number };
      review: { id: string; content: string } | null;
    };
    expect(created.entry.rating).toBe(7.5);
    expect(created.series.tmdbId).toBe(serial.tmdbId);
    expect(created.review?.content).toBe("Pretty good.");

    const myLogsResponse = await apiRequest(
      getServer().baseUrl,
      "/api/serials/logs",
      {},
      jar,
    );
    expect(myLogsResponse.status).toBe(200);
    const myLogs = (await myLogsResponse.json()) as Array<{ id: string; seriesTmdbId: number }>;
    expect(myLogs.some((log) => log.id === created.entry.id)).toBe(true);

    const seriesLogsResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/logs`,
    );
    expect(seriesLogsResponse.status).toBe(200);
    const seriesLogs = (await seriesLogsResponse.json()) as Array<{
      diaryEntryId: string;
      username: string;
    }>;
    expect(seriesLogs.some((log) => log.diaryEntryId === created.entry.id && log.username === username)).toBe(
      true,
    );
  });

  it("lets the owner update and delete a log, and hides other users' logs from mutation", async () => {
    const owner = await signUpTestUser(getServer().baseUrl, "dlogo");
    const intruder = await signUpTestUser(getServer().baseUrl, "dlogi");
    const serial = await seedTestSerial();

    const createResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/log`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watchedDate: "2026-01-02", rating: 5 }),
      },
      owner.jar,
    );
    const created = (await createResponse.json()) as { entry: { id: string } };
    const entryId = created.entry.id;

    const intruderUpdate = await apiRequest(
      getServer().baseUrl,
      `/api/serials/logs/${entryId}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating: 1 }),
      },
      intruder.jar,
    );
    expect(intruderUpdate.status).toBe(404);

    const intruderDelete = await apiRequest(
      getServer().baseUrl,
      `/api/serials/logs/${entryId}`,
      { method: "DELETE" },
      intruder.jar,
    );
    expect(intruderDelete.status).toBe(404);

    const ownerUpdate = await apiRequest(
      getServer().baseUrl,
      `/api/serials/logs/${entryId}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating: 9 }),
      },
      owner.jar,
    );
    expect(ownerUpdate.status).toBe(200);
    const updated = (await ownerUpdate.json()) as { rating: number };
    expect(updated.rating).toBe(9);

    const ownerDelete = await apiRequest(
      getServer().baseUrl,
      `/api/serials/logs/${entryId}`,
      { method: "DELETE" },
      owner.jar,
    );
    expect(ownerDelete.status).toBe(200);

    const myLogsAfterDelete = await apiRequest(
      getServer().baseUrl,
      "/api/serials/logs",
      {},
      owner.jar,
    );
    const logsAfterDelete = (await myLogsAfterDelete.json()) as Array<{ id: string }>;
    expect(logsAfterDelete.some((log) => log.id === entryId)).toBe(false);
  });

  it("bounds 'my logs' with limit/offset instead of returning everything", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "dlogp");

    for (const day of ["2026-01-01", "2026-01-02", "2026-01-03"]) {
      const serial = await seedTestSerial();
      const response = await apiRequest(
        getServer().baseUrl,
        `/api/serials/${serial.tmdbId}/log`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ watchedDate: day }),
        },
        jar,
      );
      expect(response.status).toBe(201);
    }

    const firstPage = await apiRequest(
      getServer().baseUrl,
      "/api/serials/logs?limit=2",
      {},
      jar,
    );
    const firstPageBody = (await firstPage.json()) as unknown[];
    expect(firstPageBody.length).toBe(2);

    const secondPage = await apiRequest(
      getServer().baseUrl,
      "/api/serials/logs?limit=2&offset=2",
      {},
      jar,
    );
    const secondPageBody = (await secondPage.json()) as unknown[];
    expect(secondPageBody.length).toBe(1);
  });
});
