import { describe, expect, it } from "vitest";
import { dedupeBy } from "@/lib/dedupe-by";

describe("dedupeBy", () => {
  it("keeps the first item for each key, in order", () => {
    const merged = dedupeBy(
      [
        { tmdbId: 1, page: 1 },
        { tmdbId: 2, page: 1 },
        { tmdbId: 1, page: 2 },
        { tmdbId: 3, page: 2 },
      ],
      (item) => item.tmdbId,
    );

    expect(merged).toEqual([
      { tmdbId: 1, page: 1 },
      { tmdbId: 2, page: 1 },
      { tmdbId: 3, page: 2 },
    ]);
  });
});
