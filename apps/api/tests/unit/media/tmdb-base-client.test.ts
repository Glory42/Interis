import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { fetchTMDB } from "../../../src/infrastructure/tmdb/base-client";

// #108: only rate limits, server errors and network failures are retried.
describe("fetchTMDB retries", () => {
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.TMDB_ACCESS_TOKEN;
  let calls = 0;

  const respondWith = (...responses: Array<Response | Error>) => {
    calls = 0;
    globalThis.fetch = (async () => {
      const next = responses[Math.min(calls, responses.length - 1)]!;
      calls += 1;
      if (next instanceof Error) throw next;
      return next;
    }) as unknown as typeof fetch;
  };

  beforeEach(() => {
    process.env.TMDB_ACCESS_TOKEN = "test-token";
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    process.env.TMDB_ACCESS_TOKEN = originalToken;
  });

  it("fails on the first 4xx without retrying", async () => {
    for (const status of [401, 404]) {
      respondWith(new Response("nope", { status }));
      await expect(fetchTMDB("/tv/1")).rejects.toThrow(`TMDB Error: ${status}`);
      expect(calls).toBe(1);
    }
  });

  it("retries a 5xx or 429 and returns the first success", async () => {
    respondWith(
      new Response("busy", { status: 429 }),
      new Response("down", { status: 503 }),
      Response.json({ id: 1 }),
    );
    expect(await fetchTMDB("/tv/1")).toEqual({ id: 1 });
    expect(calls).toBe(3);
  });

  it("retries network errors and gives up after three attempts", async () => {
    respondWith(new Error("socket hang up"));
    await expect(fetchTMDB("/tv/1")).rejects.toThrow("socket hang up");
    expect(calls).toBe(3);
  });
});
