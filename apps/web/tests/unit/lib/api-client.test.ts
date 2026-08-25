import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiRequest, ApiError, isApiError } from "@/lib/api-client";

// MSW works fine here too (see tests/support/environments/jsdom-native-fetch.ts
// for why it didn't used to), but this module's own request/response
// handling logic is the thing under test, and asserting exact timeout
// races and content-type branches is more precise and less timing-flaky
// against a directly-mocked fetch than a real network round trip through
// MSW - so that's the deliberate choice here, not a workaround.
const originalFetch = global.fetch;

const jsonResponse = (body: unknown, init: ResponseInit = {}): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...init,
  });

describe("apiRequest — success paths", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("parses a JSON response body", async () => {
    global.fetch = vi.fn(async () => jsonResponse({ hello: "world" }));

    const result = await apiRequest<{ hello: string }>("/api/ac-test/json");
    expect(result).toEqual({ hello: "world" });
  });

  it("returns null for a 204 response regardless of content-type", async () => {
    global.fetch = vi.fn(async () => new Response(null, { status: 204 }));

    const result = await apiRequest("/api/ac-test/204", { method: "DELETE" });
    expect(result).toBeNull();
  });

  it("returns raw text for a text/* content-type", async () => {
    global.fetch = vi.fn(
      async () =>
        new Response("plain body", { status: 200, headers: { "content-type": "text/plain" } }),
    );

    const result = await apiRequest<string>("/api/ac-test/text");
    expect(result).toBe("plain body");
  });

  it("returns null for a content-type that is neither JSON nor text", async () => {
    global.fetch = vi.fn(
      async () =>
        new Response(new Uint8Array([1, 2, 3]), {
          status: 200,
          headers: { "content-type": "application/octet-stream" },
        }),
    );

    const result = await apiRequest("/api/ac-test/binary");
    expect(result).toBeNull();
  });

  it("JSON-serializes a plain object body and sets the content-type header", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    global.fetch = fetchMock;

    await apiRequest("/api/ac-test/echo", { method: "POST", body: { a: 1 } });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get("content-type")).toContain("application/json");
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
  });

  it("does not JSON-encode a FormData body or force a content-type", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    global.fetch = fetchMock;

    const form = new FormData();
    form.set("file", "not-json");

    await apiRequest("/api/ac-test/form", { method: "POST", body: form });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    // fetch sets its own multipart boundary content-type for FormData -
    // apiRequest must not override it with application/json.
    expect(headers.has("content-type")).toBe(false);
    expect(init.body).toBe(form);
  });

  it("includes credentials by default so auth cookies are sent", async () => {
    const fetchMock = vi.fn(async () => jsonResponse({ ok: true }));
    global.fetch = fetchMock;

    await apiRequest("/api/ac-test/creds");

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(init.credentials).toBe("include");
  });
});

describe("apiRequest — error shapes", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("extracts the message from a plain string error payload", async () => {
    global.fetch = vi.fn(
      async () =>
        new Response("Something broke", {
          status: 400,
          headers: { "content-type": "text/plain" },
        }),
    );

    await expect(apiRequest("/api/ac-test/err-string")).rejects.toMatchObject({
      status: 400,
      message: "Something broke",
    });
  });

  it("extracts the message from a { error: string } payload", async () => {
    global.fetch = vi.fn(async () => jsonResponse({ error: "Flat error" }, { status: 400 }));

    await expect(apiRequest("/api/ac-test/err-flat")).rejects.toMatchObject({
      status: 400,
      message: "Flat error",
    });
  });

  it("extracts the message from the unified { error: { message, code } } payload", async () => {
    global.fetch = vi.fn(async () =>
      jsonResponse({ error: { message: "Nested error", code: "BAD_REQUEST" } }, { status: 400 }),
    );

    await expect(apiRequest("/api/ac-test/err-nested")).rejects.toMatchObject({
      status: 400,
      message: "Nested error",
    });
  });

  it("extracts the message from a { message: string } payload", async () => {
    global.fetch = vi.fn(async () =>
      jsonResponse({ message: "Top-level message" }, { status: 400 }),
    );

    await expect(apiRequest("/api/ac-test/err-message")).rejects.toMatchObject({
      status: 400,
      message: "Top-level message",
    });
  });

  it("falls back to the status text when the payload has no usable message", async () => {
    global.fetch = vi.fn(
      async () => jsonResponse({}, { status: 400, statusText: "Bad Request" }),
    );

    await expect(apiRequest("/api/ac-test/err-empty")).rejects.toMatchObject({
      status: 400,
      message: "Bad Request",
    });
  });

  it("falls back to a generic message when there is no statusText either", async () => {
    global.fetch = vi.fn(async () => jsonResponse({}, { status: 400, statusText: "" }));

    await expect(apiRequest("/api/ac-test/err-empty-2")).rejects.toMatchObject({
      status: 400,
      message: "Request failed with 400",
    });
  });

  it("preserves the raw payload on the thrown ApiError", async () => {
    global.fetch = vi.fn(async () =>
      jsonResponse({ error: "oops", extra: "field" }, { status: 422 }),
    );

    try {
      await apiRequest("/api/ac-test/err-payload");
      expect.unreachable("apiRequest should have thrown");
    } catch (error) {
      expect(isApiError(error)).toBe(true);
      expect((error as ApiError).payload).toEqual({ error: "oops", extra: "field" });
    }
  });
});

describe("apiRequest — timeout and abort", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    global.fetch = originalFetch;
  });

  it("throws a 408 ApiError when the request exceeds timeoutMs", async () => {
    global.fetch = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("The operation was aborted.");
          error.name = "AbortError";
          reject(error);
        });
      });
    });

    const requestPromise = apiRequest("/api/ac-test/slow", { timeoutMs: 10 });
    const assertion = expect(requestPromise).rejects.toMatchObject({
      status: 408,
      message: "Request timed out. Please try again.",
    });

    await vi.advanceTimersByTimeAsync(10);
    await assertion;
  });

  it("rethrows an AbortError (not an ApiError) when the caller's signal is already aborted", async () => {
    global.fetch = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        if (init?.signal?.aborted) {
          const error = new Error("The operation was aborted.");
          error.name = "AbortError";
          reject(error);
          return;
        }
      });
    });

    const controller = new AbortController();
    controller.abort();

    try {
      await apiRequest("/api/ac-test/aborted", { signal: controller.signal });
      expect.unreachable("apiRequest should have thrown");
    } catch (error) {
      expect(isApiError(error)).toBe(false);
      expect((error as Error).name).toBe("AbortError");
    }
  });

  it("aborts the in-flight request when the caller's signal fires mid-request", async () => {
    global.fetch = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("The operation was aborted.");
          error.name = "AbortError";
          reject(error);
        });
      });
    });

    const controller = new AbortController();
    const requestPromise = apiRequest("/api/ac-test/mid-abort", {
      signal: controller.signal,
      timeoutMs: 10_000,
    });
    const assertion = expect(requestPromise).rejects.toMatchObject({ name: "AbortError" });

    controller.abort();
    await assertion;
  });

  it("distinguishes a genuine external abort from a timeout racing at the same time", async () => {
    // If the external signal fires but didTimeout is still false, the
    // caught AbortError must propagate as-is (not get relabeled 408).
    global.fetch = vi.fn((_url: string, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const error = new Error("The operation was aborted.");
          error.name = "AbortError";
          reject(error);
        });
      });
    });

    const controller = new AbortController();
    const requestPromise = apiRequest("/api/ac-test/race", {
      signal: controller.signal,
      timeoutMs: 10_000,
    });
    const assertion = (async () => {
      try {
        await requestPromise;
        expect.unreachable("apiRequest should have thrown");
      } catch (error) {
        expect(isApiError(error)).toBe(false);
      }
    })();

    controller.abort();
    await assertion;
  });
});

describe("apiRequest — network failure", () => {
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("throws a status-0 ApiError when the network request fails outright", async () => {
    global.fetch = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });

    await expect(apiRequest("/api/ac-test/network-down")).rejects.toMatchObject({
      status: 0,
      message: "Unable to reach API server.",
    });
  });
});
