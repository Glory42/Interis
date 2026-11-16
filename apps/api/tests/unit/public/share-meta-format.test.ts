import { describe, expect, it } from "bun:test";
import {
  listShareText,
  profileShareText,
  reviewShareText,
  seasonLabel,
  shareExcerpt,
} from "../../../src/modules/public/helpers/share-meta-format.helper";

describe("share meta formatting", () => {
  it("collapses whitespace and leaves short text alone", () => {
    expect(shareExcerpt("  one\n\ntwo   three ")).toBe("one two three");
  });

  it("cuts long text at a word boundary with an ellipsis", () => {
    const excerpt = shareExcerpt("word ".repeat(60), 40);
    expect(excerpt.length).toBeLessThanOrEqual(40);
    expect(excerpt.endsWith("word…")).toBe(true);
  });

  it("hides a spoiler review's text", () => {
    const text = reviewShareText({ authorName: "Ana", mediaTitle: "Heat", content: "secret", containsSpoilers: true });
    expect(text).toEqual({ title: "Ana's review of Heat", description: "Contains spoilers for Heat. Read on Interis." });
  });

  it("falls back to generated descriptions for profiles and lists", () => {
    expect(profileShareText({ username: "ana", displayName: "Ana", bio: "  " }).description).toBe(
      "Ana's movie and TV journal on Interis.",
    );
    expect(listShareText({ title: "Top", ownerName: "Ana", description: null, entryCount: 1 }).description).toBe(
      "1 title curated by Ana on Interis.",
    );
  });

  it("names season 0 Specials", () => {
    expect(seasonLabel(0)).toBe("Specials");
    expect(seasonLabel(3)).toBe("Season 3");
  });
});
