import { readFileSync } from "node:fs";
import path from "node:path";
import { HTMLRewriter as WasmRewriter } from "html-rewriter-wasm";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleLinkPreview } from "../../../link-preview/handler";
import { server } from "../../support/msw/server";

const indexHtml = readFileSync(path.resolve(__dirname, "../../../index.html"), "utf8");
const API = "https://api.interis.example";
const DISCORD = "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)";
const CHROME = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

type Handlers = { element(element: unknown): void };

// The Workers HTMLRewriter API (`on` + `transform`) on top of the wasm build.
class TestRewriter {
  private readonly handlers: [string, Handlers][] = [];
  on(selector: string, handlers: Handlers) {
    this.handlers.push([selector, handlers]);
    return this;
  }
  transform(response: Response): Response {
    const run = async () => {
      let output = "";
      const decoder = new TextDecoder();
      const rewriter = new WasmRewriter((chunk) => {
        output += decoder.decode(chunk);
      });
      for (const [selector, handlers] of this.handlers) rewriter.on(selector, handlers as never);
      await rewriter.write(new TextEncoder().encode(await response.text()));
      await rewriter.end();
      rewriter.free();
      return output;
    };
    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(new TextEncoder().encode(await run()));
        controller.close();
      },
    });
    return new Response(stream, { status: response.status, headers: response.headers });
  }
}

const servePage = () =>
  vi.fn(async () => new Response(indexHtml, { headers: { "content-type": "text/html; charset=utf-8" } }));

const invoke = async (pathname: string, userAgent: string) => {
  const next = servePage();
  const context = {
    request: new Request(`https://interis.example${pathname}`, { headers: { "user-agent": userAgent } }),
    env: { VITE_API_BASE_URL: API },
    next,
  };
  const response = await handleLinkPreview(context as never);
  return { response, next, html: await response.text() };
};

describe("handleLinkPreview", () => {
  const metaRequests = vi.fn();

  beforeEach(() => {
    vi.stubGlobal("HTMLRewriter", TestRewriter);
    server.use(
      http.get(`${API}/api/public/meta/movie/27205`, () => {
        metaRequests();
        return HttpResponse.json({
          kind: "film",
          ogType: "video.movie",
          title: "Inception (2010)",
          description: "A thief who steals secrets through dreams.",
          image: "/api/public/og/movie/27205.jpg",
          path: "/movies/27205",
        });
      }),
      http.get(`${API}/api/public/meta/movie/500`, () => {
        metaRequests();
        return new HttpResponse(null, { status: 500 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    metaRequests.mockReset();
  });

  it("passes humans straight through without calling the API", async () => {
    const { html, next } = await invoke("/movies/27205", CHROME);
    expect(next).toHaveBeenCalledTimes(1);
    expect(metaRequests).not.toHaveBeenCalled();
    expect(html).toBe(indexHtml);
  });

  it("gives a link-preview bot the page's own meta", async () => {
    const { html, response } = await invoke("/movies/27205", DISCORD);
    expect(metaRequests).toHaveBeenCalledTimes(1);
    expect(html).toContain("<title>Inception (2010) — Interis</title>");
    expect(html).toContain(`<meta property="og:image" content="${API}/api/public/og/movie/27205.jpg" />`);
    expect(html).toContain('<meta property="og:url" content="https://interis.example/movies/27205" />');
    expect(html).not.toContain('<meta property="og:title" content="Interis" />');
    expect(response.headers.get("vary")).toContain("User-Agent");
  });

  it("falls back to the unmodified page when the API fails", async () => {
    const { html } = await invoke("/movies/500", DISCORD);
    expect(metaRequests).toHaveBeenCalledTimes(1);
    expect(html).toBe(indexHtml);
  });

  it("leaves pages without a preview alone, even for bots", async () => {
    const { html } = await invoke("/settings", DISCORD);
    expect(metaRequests).not.toHaveBeenCalled();
    expect(html).toBe(indexHtml);
  });
});
