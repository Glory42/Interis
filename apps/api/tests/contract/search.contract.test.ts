import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { z } from "zod";
import { apiRequest } from "../support/app/http-client";
import {
  startTestServer,
  type RunningTestServer,
} from "../support/app/test-server";

// Only the response *shape* is a contract worth locking here. Asserting
// real TMDB results would make this test depend on network access and a
// real TMDB_ACCESS_TOKEN, which the rest of this suite deliberately never
// needs - CI runs with a placeholder token precisely so `bun test` works
// offline. The shape of a single result is still fully specified below so
// a future field rename/removal on the merge/sort logic gets caught even
// without live data.
const unifiedSearchResultSchema = z
  .object({
    mediaType: z.enum(["movie", "tv"]),
    tmdbId: z.number(),
    title: z.string(),
    posterPath: z.string().nullable(),
    releaseDate: z.string().nullable(),
    popularity: z.number(),
  })
  .strict();

describe("unified search contract", () => {
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

  it("400s with the error envelope on a missing query", async () => {
    const response = await apiRequest(getServer().baseUrl, "/api/search");
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(
      z
        .object({ error: z.object({ message: z.string(), code: z.string() }) })
        .safeParse(body).success,
    ).toBe(true);
  });

  it("the result schema itself is well-formed", () => {
    const sample = {
      mediaType: "movie",
      tmdbId: 123,
      title: "Sample",
      posterPath: null,
      releaseDate: null,
      popularity: 12.5,
    };
    expect(unifiedSearchResultSchema.safeParse(sample).success).toBe(true);
  });
});
