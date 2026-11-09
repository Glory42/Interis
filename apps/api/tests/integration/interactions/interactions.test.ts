import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { apiRequest } from "../../support/app/http-client";
import { signUpTestUser } from "../../support/app/auth-flow";
import { seedTestFilm } from "../../support/factories/media.factory";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

describe("movie-level interaction", () => {
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

  it("returns 400 for an invalid tmdbId", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "iibadid");
    const response = await apiRequest(
      getServer().baseUrl,
      "/api/interactions/not-a-number",
      {},
      jar,
    );
    expect(response.status).toBe(400);
  });

  it("rejects an update body with no recognized fields", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "iiempty");
    const movie = await seedTestFilm();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/interactions/${movie.tmdbId}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      },
      jar,
    );
    expect(response.status).toBe(400);
  });

  it("rating implicitly marks the movie watched", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "iiratewat");
    const movie = await seedTestFilm();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/interactions/${movie.tmdbId}`,
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

  it("liking implicitly marks the movie watched", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "iilikewat");
    const movie = await seedTestFilm();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/interactions/${movie.tmdbId}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ liked: true }),
      },
      jar,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { liked: boolean; watched: boolean };
    expect(body.liked).toBe(true);
    expect(body.watched).toBe(true);
  });

  it("on insert, an explicit watched:false is respected over the implicit-watch signal", async () => {
    // InteractionsRepository.upsertInteractionState's insert `.values()`
    // uses `input.watched ?? input.isImplicitlyWatched`, so a fresh row
    // (no prior interaction) honors an explicit watched:false even while
    // also liking the movie in the same request.
    const { jar } = await signUpTestUser(getServer().baseUrl, "iiasymins");
    const movie = await seedTestFilm();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/interactions/${movie.tmdbId}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ liked: true, watched: false }),
      },
      jar,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { watched: boolean };
    expect(body.watched).toBe(false);
  });

  it("on update, the implicit-watch signal wins over an explicit watched:false", async () => {
    // Documented asymmetry in InteractionsRepository.upsertInteractionState:
    // on conflict (a row already exists), isImplicitlyWatched is applied
    // after the explicit `watched` field in the `set` clause, so liking a
    // movie while also explicitly sending watched:false still results in
    // watched:true - the opposite of the insert-path behavior above.
    const { jar } = await signUpTestUser(getServer().baseUrl, "iiasymupd");
    const movie = await seedTestFilm();

    await apiRequest(
      getServer().baseUrl,
      `/api/interactions/${movie.tmdbId}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watchlisted: true }),
      },
      jar,
    );

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/interactions/${movie.tmdbId}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ liked: true, watched: false }),
      },
      jar,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { watched: boolean };
    expect(body.watched).toBe(true);
  });

  it("explicit watched:true is respected when there is no implicit signal", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "iiexplicit");
    const movie = await seedTestFilm();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/interactions/${movie.tmdbId}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ watched: true }),
      },
      jar,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { watched: boolean; liked: boolean };
    expect(body.watched).toBe(true);
    expect(body.liked).toBe(false);
  });

  it("watchlisting a movie in the same request as liking it is respected over the auto-clear", async () => {
    const { jar } = await signUpTestUser(getServer().baseUrl, "iiwlexplicit");
    const movie = await seedTestFilm();

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/interactions/${movie.tmdbId}`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ liked: true, watchlisted: true }),
      },
      jar,
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { liked: boolean; watchlisted: boolean };
    expect(body.liked).toBe(true);
    expect(body.watchlisted).toBe(true);
  });
});
