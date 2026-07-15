import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestSerial } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("series-level interaction", () => {
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

  it("requires auth to read or write a series interaction", async () => {
    const serial = await seedTestSerial();

    const getResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/interaction`,
    );
    expect(getResponse.status).toBe(401);

    const putResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ liked: true }),
      },
    );
    expect(putResponse.status).toBe(401);
  });

  it("defaults to all-false/null before any interaction exists", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "sidef");
    const serial = await seedTestSerial();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/interaction`,
      {},
      jar,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as {
      liked: boolean;
      watchlisted: boolean;
      rating: number | null;
      watched: boolean;
    };
    expect(body).toEqual({
      liked: false,
      watchlisted: false,
      rating: null,
      watched: false,
    });
  });

  it("persists a partial update without clobbering other fields", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "sipar");
    const serial = await seedTestSerial();

    const likeResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ liked: true }),
      },
      jar,
    );
    expect(likeResponse.status).toBe(200);

    const watchlistResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watchlisted: true }),
      },
      jar,
    );
    expect(watchlistResponse.status).toBe(200);
    const watchlistBody = (await watchlistResponse.json()) as {
      liked: boolean;
      watchlisted: boolean;
    };
    // Setting watchlisted must not reset the earlier liked:true.
    expect(watchlistBody.liked).toBe(true);
    expect(watchlistBody.watchlisted).toBe(true);

    const getResponse = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/interaction`,
      {},
      jar,
    );
    const getBody = (await getResponse.json()) as {
      liked: boolean;
      watchlisted: boolean;
    };
    expect(getBody.liked).toBe(true);
    expect(getBody.watchlisted).toBe(true);
  });

  it("rating implicitly marks the series watched", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "siwat");
    const serial = await seedTestSerial();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/serials/${serial.tmdbId}/interaction`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating: 8 }),
      },
      jar,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { rating: number; watched: boolean };
    expect(body.rating).toBe(8);
    expect(body.watched).toBe(true);
  });
});
