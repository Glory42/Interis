import { describe, expect, it } from "vitest";
import { listShareText, reviewShareText, shareCardUrl, shareExcerpt, shareHeadMeta } from "@/lib/share-meta";

// The same cases as apps/api/tests/unit/public/share-meta-format.test.ts: bots and browsers
// must read the same titles and descriptions.
describe("share meta", () => {
  it("collapses whitespace and cuts long text at a word boundary", () => {
    expect(shareExcerpt("  one\n\ntwo   three ")).toBe("one two three");
    const excerpt = shareExcerpt("word ".repeat(60), 40);
    expect(excerpt.length).toBeLessThanOrEqual(40);
    expect(excerpt.endsWith("word…")).toBe(true);
  });

  it("hides a spoiler review's text", () => {
    expect(reviewShareText({ authorName: "Ana", mediaTitle: "Heat", content: "secret", containsSpoilers: true })).toEqual({
      title: "Ana's review of Heat",
      description: "Contains spoilers for Heat. Read on Interis.",
    });
  });

  it("describes an empty list by its size", () => {
    expect(listShareText({ title: "Top", ownerName: "ana", description: null, entryCount: 1 })).toEqual({
      title: "Top · a list by ana",
      description: "1 title curated by ana on Interis.",
    });
  });

  it("versions card URLs by the content's update time", () => {
    expect(shareCardUrl("review", "abc", "2026-01-01T00:00:00.000Z")).toBe(
      `http://localhost/api/public/og/review/abc.png?v=${(1767225600).toString(36)}`,
    );
    expect(shareCardUrl("movie", 27205)).toBe("http://localhost/api/public/og/movie/27205.png");
  });

  it("builds the head entries with the static card as a fallback", () => {
    const meta = shareHeadMeta({ title: "Heat", description: "d" }, { image: null, ogType: "video.movie" });
    expect(meta).toContainEqual({ title: "Heat — Interis" });
    expect(meta).toContainEqual({ property: "og:image", content: "/og-image.png" });
    expect(meta).toContainEqual({ name: "twitter:card", content: "summary_large_image" });
  });
});
