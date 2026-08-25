import { describe, expect, it } from "bun:test";
import {
  computeWeightedTmdbRating,
  sortByWeightedTmdbRatingDesc,
} from "../../../src/modules/media/helpers/media-weighted-rating.helper";
import { mergeCommunityRatings } from "../../../src/modules/media/helpers/media-community-rating.helper";
import { normalizeVoteAverage } from "../../../src/modules/media/helpers/media-vote-average.helper";
import { buildMediaRatingBreakdown } from "../../../src/modules/media/helpers/media-rating-breakdown.helper";

describe("computeWeightedTmdbRating", () => {
  it("returns null when there is no rating", () => {
    expect(computeWeightedTmdbRating(null, 1000, 100)).toBeNull();
  });

  it("pulls a low-vote-count rating toward the global mean", () => {
    // 10 votes at a perfect 10, min-votes threshold of 100 — should be
    // pulled far below 10 toward the 6.5 global mean.
    const score = computeWeightedTmdbRating(10, 10, 100);
    expect(score).not.toBeNull();
    expect(score!).toBeLessThan(7);
    expect(score!).toBeGreaterThan(6.5);
  });

  it("barely adjusts a rating once vote count far exceeds the confidence threshold", () => {
    const score = computeWeightedTmdbRating(8.5, 1_000_000, 100);
    expect(score!).toBeCloseTo(8.5, 2);
  });

  it("treats a null vote count as zero votes", () => {
    const withNull = computeWeightedTmdbRating(9, null, 100);
    const withZero = computeWeightedTmdbRating(9, 0, 100);
    expect(withNull).toBe(withZero!);
  });
});

describe("sortByWeightedTmdbRatingDesc", () => {
  it("sorts higher-confidence items above unreliable high scorers", () => {
    const items = [
      { id: "unreliable", tmdbRatingOutOfTen: 10, tmdbVoteCount: 5 },
      { id: "reliable", tmdbRatingOutOfTen: 8, tmdbVoteCount: 5000 },
    ];
    const sorted = sortByWeightedTmdbRatingDesc(items, 100, () => 0);
    expect(sorted.map((i) => i.id)).toEqual(["reliable", "unreliable"]);
  });

  it("always places null-rated items last, regardless of tie-break", () => {
    const items = [
      { id: "rated", tmdbRatingOutOfTen: 1, tmdbVoteCount: 1 },
      { id: "unrated", tmdbRatingOutOfTen: null, tmdbVoteCount: null },
    ];
    const sorted = sortByWeightedTmdbRatingDesc(items, 100, () => 0);
    expect(sorted.map((i) => i.id)).toEqual(["rated", "unrated"]);
  });

  it("falls back to the tie-break function when scores are equal", () => {
    const items = [
      { id: "b", tmdbRatingOutOfTen: 7, tmdbVoteCount: 100 },
      { id: "a", tmdbRatingOutOfTen: 7, tmdbVoteCount: 100 },
    ];
    const sorted = sortByWeightedTmdbRatingDesc(items, 100, (left, right) =>
      left.id.localeCompare(right.id),
    );
    expect(sorted.map((i) => i.id)).toEqual(["a", "b"]);
  });
});

describe("mergeCommunityRatings", () => {
  it("includes both diary and interaction-only ratings", () => {
    const merged = mergeCommunityRatings(
      [{ userId: "u1", rating: 8 }],
      [{ userId: "u2", rating: 6 }],
    );
    expect(merged).toEqual([{ rating: 8 }, { rating: 6 }]);
  });

  it("prefers a user's diary rating over their interaction rating (no double-count)", () => {
    const merged = mergeCommunityRatings(
      [{ userId: "u1", rating: 9 }],
      [{ userId: "u1", rating: 3 }],
    );
    expect(merged).toEqual([{ rating: 9 }]);
  });

  it("includes multiple diary ratings from the same user (per-log averaging)", () => {
    const merged = mergeCommunityRatings(
      [
        { userId: "u1", rating: 9 },
        { userId: "u1", rating: 7 },
      ],
      [],
    );
    expect(merged).toEqual([{ rating: 9 }, { rating: 7 }]);
  });
});

describe("normalizeVoteAverage", () => {
  it("rounds to one decimal place", () => {
    expect(normalizeVoteAverage(7.849)).toBe(7.8);
  });

  it("treats null, undefined, zero, and negative values as null", () => {
    expect(normalizeVoteAverage(null)).toBeNull();
    expect(normalizeVoteAverage(undefined)).toBeNull();
    expect(normalizeVoteAverage(0)).toBeNull();
    expect(normalizeVoteAverage(-1)).toBeNull();
  });

  it("treats non-finite values as null", () => {
    expect(normalizeVoteAverage(Number.NaN)).toBeNull();
    expect(normalizeVoteAverage(Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe("buildMediaRatingBreakdown", () => {
  it("returns a zeroed breakdown for no ratings", () => {
    const result = buildMediaRatingBreakdown([]);
    expect(result.totalRatedReviews).toBe(0);
    expect(result.averageRating).toBeNull();
    expect(result.buckets.every((b) => b.count === 0 && b.percentage === 0)).toBe(true);
  });

  it("ignores rows with a null rating", () => {
    const result = buildMediaRatingBreakdown([{ rating: null }, { rating: 8 }]);
    expect(result.totalRatedReviews).toBe(1);
  });

  it("buckets by rounded rating and computes percentages", () => {
    const result = buildMediaRatingBreakdown([
      { rating: 8.4 },
      { rating: 8.6 },
      { rating: 2 },
    ]);
    expect(result.totalRatedReviews).toBe(3);

    const bucket8 = result.buckets.find((b) => b.ratingValue === 8);
    const bucket9 = result.buckets.find((b) => b.ratingValue === 9);
    const bucket2 = result.buckets.find((b) => b.ratingValue === 2);
    expect(bucket8?.count).toBe(1);
    expect(bucket9?.count).toBe(1);
    expect(bucket2?.count).toBe(1);
    expect(bucket2?.percentage).toBe(33);
  });

  it("clamps out-of-range rounded ratings into the 1-10 buckets", () => {
    const result = buildMediaRatingBreakdown([{ rating: 0.2 }]);
    const bucket1 = result.buckets.find((b) => b.ratingValue === 1);
    expect(bucket1?.count).toBe(1);
  });

  it("orders buckets from 10 down to 1", () => {
    const result = buildMediaRatingBreakdown([]);
    expect(result.buckets.map((b) => b.ratingValue)).toEqual([10, 9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });
});
