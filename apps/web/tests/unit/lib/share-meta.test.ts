import { describe, expect, it } from "vitest";
import {
  listShareText,
  recapShareText,
  reviewShareText,
  shareCardUrl,
  shareExcerpt,
  shareHeadMeta,
} from "@/lib/share-meta";

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
      `http://localhost/api/public/og/review/abc.jpg?v=${(1767225600).toString(36)}`,
    );
    expect(shareCardUrl("movie", 27205)).toBe("http://localhost/api/public/og/movie/27205.jpg");
  });

  it("sums up a recap by its headline numbers and top director or genre", () => {
    const recap = {
      year: 2025,
      isPartialYear: false,
      depth: "full" as const,
      user: { displayName: "Ana" },
      totals: { films: 1, series: 2, hoursWatched: 30 },
      topDirectors: [],
      topGenres: [{ genre: "Drama" }],
    };
    expect(recapShareText(recap)).toEqual({
      title: "Ana's 2025 in review",
      description: "1 film, 2 series and 30 hours on Interis. Top genre: Drama.",
    });
    expect(recapShareText({ ...recap, isPartialYear: true, depth: "empty" })).toEqual({
      title: "Ana's 2025 so far",
      description: "Ana's year in film and TV on Interis.",
    });
    expect(shareCardUrl("recap", "ana b/2025")).toBe("http://localhost/api/public/og/recap/ana%20b/2025.jpg");
  });

  it("builds the head entries with the static card as a fallback", () => {
    const meta = shareHeadMeta({ title: "Heat", description: "d" }, { image: null, ogType: "video.movie" });
    expect(meta).toContainEqual({ title: "Heat — Interis" });
    expect(meta).toContainEqual({ property: "og:image", content: "/og-image.png" });
    expect(meta).toContainEqual({ name: "twitter:card", content: "summary_large_image" });
  });
});
