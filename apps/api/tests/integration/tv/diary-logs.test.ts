import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestSeries } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

// Reading Series logs. The log lifecycle is in watch-log/.
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

  it("surfaces a log with its review in both 'my logs' and the series' logs", async () => {
    const { jar, username } = await signUpTestUser(getServer().baseUrl, "dlog");
    const serial = await seedTestSeries("Diary Test Serial");

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

  it("bounds 'my logs' with limit/offset instead of returning everything", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "dlogp");

    for (const day of ["2026-01-01", "2026-01-02", "2026-01-03"]) {
      const serial = await seedTestSeries();
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
