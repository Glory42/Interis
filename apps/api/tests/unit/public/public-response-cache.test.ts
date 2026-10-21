import { describe, expect, it } from "bun:test";
import type { NextFunction, Request, Response } from "express";
import { createPublicResponseCache } from "../../../src/modules/public/helpers/public-response-cache.helper";

type FakeResponse = Response & { sentBodies: unknown[]; headers: Record<string, string> };

const fakeResponse = (): FakeResponse => {
  const res = {
    statusCode: 200,
    sentBodies: [] as unknown[],
    headers: {} as Record<string, string>,
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    setHeader(name: string, value: string) {
      res.headers[name] = value;
      return res;
    },
    getHeader(name: string) {
      return res.headers[name];
    },
    json(body: unknown) {
      res.sentBodies.push(body);
      return res;
    },
  };
  return res as unknown as FakeResponse;
};

const fakeRequest = (url: string, method = "GET") =>
  ({ method, originalUrl: url }) as unknown as Request;

// Runs the middleware; on a miss, plays the controller by responding via res.json.
const run = (
  middleware: ReturnType<typeof createPublicResponseCache>,
  url: string,
  respond: (res: Response) => void,
) => {
  const res = fakeResponse();
  let handlerCalls = 0;
  const next: NextFunction = () => {
    handlerCalls += 1;
    respond(res);
  };
  middleware(fakeRequest(url), res, next);
  return { res, handlerCalls };
};

describe("createPublicResponseCache", () => {
  it("serves a repeat request from memory without running the handler", () => {
    const cache = createPublicResponseCache({ ttlMs: 60_000, maxEntries: 10 });
    const respond = (res: Response) => {
      res.setHeader("Cache-Control", "public, max-age=300");
      res.status(200).json({ n: 1 });
    };

    const first = run(cache, "/api/public/alice/diary?limit=5", respond);
    const second = run(cache, "/api/public/alice/diary?limit=5", respond);

    expect(first.handlerCalls).toBe(1);
    expect(second.handlerCalls).toBe(0);
    expect(second.res.sentBodies).toEqual([{ n: 1 }]);
    expect(second.res.headers["X-Cache"]).toBe("HIT");
    expect(second.res.headers["Cache-Control"]).toBe("public, max-age=300");
  });

  it("caches 404s but not server errors", () => {
    const cache = createPublicResponseCache({ ttlMs: 60_000, maxEntries: 10 });

    run(cache, "/api/public/ghost/profile", (res) => res.status(404).json({ error: 1 }));
    expect(run(cache, "/api/public/ghost/profile", () => {}).handlerCalls).toBe(0);

    run(cache, "/api/public/bob/profile", (res) => res.status(500).json({ error: 1 }));
    expect(
      run(cache, "/api/public/bob/profile", (res) => res.status(200).json({})).handlerCalls,
    ).toBe(1);
  });

  it("keys by full URL including the query string", () => {
    const cache = createPublicResponseCache({ ttlMs: 60_000, maxEntries: 10 });
    const respond = (res: Response) => res.status(200).json({});

    run(cache, "/api/public/alice/diary?limit=5", respond);
    expect(run(cache, "/api/public/alice/diary?limit=10", respond).handlerCalls).toBe(1);
  });

  it("evicts the oldest entry once full, and is a pass-through when ttl is 0", () => {
    const cache = createPublicResponseCache({ ttlMs: 60_000, maxEntries: 1 });
    const respond = (res: Response) => res.status(200).json({});

    run(cache, "/a", respond);
    run(cache, "/b", respond);
    expect(run(cache, "/a", respond).handlerCalls).toBe(1);

    const disabled = createPublicResponseCache({ ttlMs: 0, maxEntries: 10 });
    run(disabled, "/a", respond);
    expect(run(disabled, "/a", respond).handlerCalls).toBe(1);
  });
});
