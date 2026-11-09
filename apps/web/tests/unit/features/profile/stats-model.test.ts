import { describe, expect, it } from "vitest";
import { fillLastTwelveMonths, toRatingBuckets } from "@/features/profile/components/stats/stats-model";

describe("fillLastTwelveMonths", () => {
  it("keeps empty months so the bars never skip one", () => {
    const months = fillLastTwelveMonths([{ month: "2026-11", count: 4 }, { month: "2026-09", count: 2 }], new Date(2026, 10, 7));
    expect(months).toHaveLength(12);
    expect(months[0]).toEqual({ key: "2025-12", label: "D", count: 0 });
    expect(months.slice(-3)).toEqual([
      { key: "2026-09", label: "S", count: 2 },
      { key: "2026-10", label: "O", count: 0 },
      { key: "2026-11", label: "N", count: 4 },
    ]);
  });
});

describe("toRatingBuckets", () => {
  it("lays scores out in half steps from 1 to 10", () => {
    const buckets = toRatingBuckets([{ rating: 8, count: 3 }, { rating: 7.5, count: 1 }]);
    expect(buckets).toHaveLength(19);
    expect(buckets[0]).toEqual({ rating: 1, count: 0 });
    expect(buckets.find((bucket) => bucket.rating === 8)?.count).toBe(3);
    expect(buckets.find((bucket) => bucket.rating === 7.5)?.count).toBe(1);
  });
});
