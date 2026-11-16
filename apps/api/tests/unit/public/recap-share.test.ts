import { describe, expect, it } from "bun:test";
import {
  recapCardStats,
  recapHighlight,
  recapShareText,
  recapVersion,
} from "../../../src/modules/public/helpers/recap-share.helper";
import type { YearReview } from "../../../src/modules/year-review/types/year-review.types";

const recap = (overrides: Partial<YearReview> = {}) =>
  ({
    year: 2025,
    isPartialYear: false,
    depth: "full",
    user: { username: "ana", displayName: "Ana", avatarUrl: null },
    totals: { films: 1, series: 2, hoursWatched: 30 },
    topGenres: [{ genre: "Drama", count: 3 }],
    topDirectors: [],
    posterPaths: ["/a.jpg"],
    ...overrides,
  }) as YearReview;

// The same cases as apps/web/tests/unit/lib/share-meta.test.ts (recapShareText).
describe("recap share text and card input", () => {
  it("sums up a recap by its headline numbers and top director or genre", () => {
    expect(recapShareText(recap())).toEqual({
      title: "Ana's 2025 in review",
      description: "1 film, 2 series and 30 hours on Interis. Top genre: Drama.",
    });
    expect(recapShareText(recap({ isPartialYear: true, depth: "empty" }))).toEqual({
      title: "Ana's 2025 so far",
      description: "Ana's year in film and TV on Interis.",
    });
  });

  it("prefers the top director and leaves out zero Series and hours", () => {
    const withDirector = recap({
      topDirectors: [{ director: "Ada Lens", count: 2, slug: null }],
      totals: { films: 3, series: 0, hoursWatched: 0 } as YearReview["totals"],
    });
    expect(recapHighlight(withDirector)).toEqual({ label: "Top director", value: "Ada Lens" });
    expect(recapCardStats(withDirector)).toEqual([{ label: "Films", value: 3 }]);
    expect(recapShareText(withDirector).description).toBe("3 films on Interis. Top director: Ada Lens.");
    expect(recapCardStats(recap({ depth: "empty" }))).toEqual([]);
  });

  it("versions the card by what it shows", () => {
    expect(recapVersion(recap())).toMatch(/^[0-9a-f]{10}$/);
    expect(recapVersion(recap())).toBe(recapVersion(recap()));
    expect(recapVersion(recap({ posterPaths: ["/b.jpg"] }))).not.toBe(recapVersion(recap()));
  });
});
