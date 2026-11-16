import { readFileSync } from "node:fs";
import path from "node:path";
import { HTMLRewriter } from "html-rewriter-wasm";
import { describe, expect, it } from "vitest";
import { applyHeadTags, buildHeadTags, isShareMeta, type ShareMeta } from "../../../link-preview/inject-meta";

const indexHtml = readFileSync(path.resolve(__dirname, "../../../index.html"), "utf8");
const origins = { siteOrigin: "https://interis.example", apiOrigin: "https://api.interis.example" };

const reviewMeta: ShareMeta = {
  ogType: "article",
  title: `Ana's review of "Heat" <1995>`,
  description: "Tense & brilliant.",
  image: "/api/public/og/review/abc.png?v=x1",
  path: "/reviews/ana/abc",
};

// Runs the same handlers the Pages Function registers, through the wasm build of HTMLRewriter.
const rewrite = async (html: string, tags: string): Promise<string> => {
  let output = "";
  const decoder = new TextDecoder();
  const rewriter = new HTMLRewriter((chunk) => {
    output += decoder.decode(chunk);
  });
  applyHeadTags(rewriter, tags);
  await rewriter.write(new TextEncoder().encode(html));
  await rewriter.end();
  rewriter.free();
  return output;
};

const metaContent = (html: string, attribute: string, key: string): string[] =>
  [...html.matchAll(new RegExp(`<meta ${attribute}="${key}" content="([^"]*)"`, "g"))].map((match) => match[1] ?? "");

describe("buildHeadTags", () => {
  it("escapes text and resolves the card against the API origin", () => {
    const tags = buildHeadTags(reviewMeta, origins);
    expect(tags).toContain("<title>Ana&#39;s review of &quot;Heat&quot; &lt;1995&gt; — Interis</title>");
    expect(tags).toContain('<meta property="og:image" content="https://api.interis.example/api/public/og/review/abc.png?v=x1" />');
    expect(tags).toContain('<meta property="og:image:width" content="1200" />');
    expect(tags).toContain('<link rel="canonical" href="https://interis.example/reviews/ana/abc" />');
    expect(tags).toContain('<meta name="twitter:card" content="summary_large_image" />');
  });

  it("uses an absolute image as is and falls back to the static card", () => {
    const person = buildHeadTags({ ...reviewMeta, image: "https://image.tmdb.org/t/p/h632/x.jpg" }, origins);
    expect(person).toContain('content="https://image.tmdb.org/t/p/h632/x.jpg"');
    expect(person).not.toContain("og:image:width");

    const none = buildHeadTags({ ...reviewMeta, image: null }, origins);
    expect(none).toContain('<meta property="og:image" content="https://interis.example/og-image.png" />');
  });
});

describe("applyHeadTags", () => {
  it("replaces the SPA's generic preview tags with the page's own, leaving the rest intact", async () => {
    const html = await rewrite(indexHtml, buildHeadTags(reviewMeta, origins));

    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html).toContain("<title>Ana&#39;s review of &quot;Heat&quot; &lt;1995&gt; — Interis</title>");
    expect(metaContent(html, "property", "og:title")).toEqual([`Ana&#39;s review of &quot;Heat&quot; &lt;1995&gt;`]);
    expect(metaContent(html, "name", "description")).toEqual(["Tense &amp; brilliant."]);
    expect(metaContent(html, "property", "og:image")).toEqual([
      "https://api.interis.example/api/public/og/review/abc.png?v=x1",
    ]);
    expect(metaContent(html, "name", "twitter:card")).toEqual(["summary_large_image"]);
    expect(metaContent(html, "property", "og:site_name")).toEqual(["Interis"]);
    // Everything else in index.html survives.
    expect(html).toContain('<div id="root"></div>');
    expect(html).toContain('<script src="/theme-registry.js"></script>');
    expect(html).toContain('<meta name="theme-color" content="#171420" />');
  });
});

describe("isShareMeta", () => {
  it("accepts the API's shape and rejects anything else", () => {
    expect(isShareMeta({ ...reviewMeta, kind: "review" })).toBe(true);
    expect(isShareMeta({ ...reviewMeta, path: "https://evil.example/" })).toBe(false);
    expect(isShareMeta({ ...reviewMeta, title: 1 })).toBe(false);
    expect(isShareMeta(null)).toBe(false);
  });
});
