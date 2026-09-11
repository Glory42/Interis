import { describe, expect, it } from "bun:test";
import {
  rankTrendingTitles,
  type TrendingSignal,
} from "../../../src/modules/social/helpers/social-trending.helper";

const signal = (
  over: Partial<TrendingSignal> & { userId: string; tmdbId: number },
): TrendingSignal => ({
  mediaType: "movie",
  title: "Untitled",
  posterPath: null,
  releaseYear: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  ...over,
});

describe("rankTrendingTitles", () => {
  it("counts each user once per title, even with multiple qualifying activities from the same user", () => {
    const signals = [
      signal({ userId: "u1", tmdbId: 1 }),
      signal({ userId: "u1", tmdbId: 1 }),
      signal({ userId: "u1", tmdbId: 1 }),
    ];

    const result = rankTrendingTitles(signals, 6);

    expect(result).toHaveLength(1);
    expect(result[0]!.distinctUserCount).toBe(1);
  });

  it("ranks titles by distinct-user count, descending", () => {
    const signals = [
      signal({ userId: "u1", tmdbId: 1 }),
      signal({ userId: "u1", tmdbId: 2 }),
      signal({ userId: "u2", tmdbId: 2 }),
      signal({ userId: "u3", tmdbId: 2 }),
    ];

    const result = rankTrendingTitles(signals, 6);

    expect(result.map((title) => ({ tmdbId: title.tmdbId, distinctUserCount: title.distinctUserCount }))).toEqual([
      { tmdbId: 2, distinctUserCount: 3 },
      { tmdbId: 1, distinctUserCount: 1 },
    ]);
  });

  it("caps results to the given limit", () => {
    const signals = [
      signal({ userId: "u1", tmdbId: 1 }),
      signal({ userId: "u1", tmdbId: 2 }),
      signal({ userId: "u1", tmdbId: 3 }),
    ];

    const result = rankTrendingTitles(signals, 2);

    expect(result).toHaveLength(2);
  });
});
