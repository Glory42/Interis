import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { randomInt } from "node:crypto";
import { apiRequest } from "../../support/app/http-client";
import { PeopleCacheService } from "../../../src/modules/people/services/people-cache.service";
import {
  startTestServer,
  type RunningTestServer,
} from "../../support/app/test-server";

// GET /api/people/:role/:slug had no HTTP coverage. The 200 path needs live
// TMDB person data this offline suite doesn't have (getPersonDetails failing
// collapses the whole response to null), but the routing contract - role
// validation, slug normalization, unknown-person 404, and the
// "row exists locally but TMDB is unavailable" 404 - is all deterministic.
describe("GET /api/people/:role/:slug", () => {
  let testServer: RunningTestServer | null = null;

  const getServer = (): RunningTestServer => {
    if (!testServer) throw new Error("Test server is not running");
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

  it("400s on a role outside {actor, director}", async () => {
    const response = await apiRequest(getServer().baseUrl, "/api/people/writer/greta-gerwig");
    expect(response.status).toBe(400);
  });

  it("400s on a slug containing characters a route slug can never have", async () => {
    const response = await apiRequest(getServer().baseUrl, "/api/people/director/greta_gerwig");
    expect(response.status).toBe(400);
  });

  it("404s for a slug that matches no cached person", async () => {
    const response = await apiRequest(
      getServer().baseUrl,
      `/api/people/director/nobody-here-${randomInt(100000, 999999)}`,
    );
    expect(response.status).toBe(404);
  });

  it("404s when the person row exists locally but TMDB detail is unavailable", async () => {
    const name = `Cached Person ${randomInt(100000, 999999)}`;
    const cached = await PeopleCacheService.upsertPersonCache({
      tmdbPersonId: randomInt(1_000_000, 999_000_000),
      name,
      knownForDepartment: "Acting",
      routeRoleHints: ["actor"],
      profilePath: "/cached.jpg",
      popularity: 3.2,
    });

    const response = await apiRequest(
      getServer().baseUrl,
      `/api/people/actor/${cached!.slug}`,
    );
    expect(response.status).toBe(404);
  });
});
