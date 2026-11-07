import { describe, expect, it } from "vitest";
import { clearRecentSearches, pushRecentSearch, readRecentSearches } from "@/features/search/recent-searches";

describe("recent searches", () => {
  it("keeps the newest first, without repeats, up to eight", () => {
    for (const query of ["a1", "b2", "c3", "d4", "e5", "f6", "g7", "h8", "i9"]) pushRecentSearch(query);
    pushRecentSearch("C3");

    const recent = readRecentSearches();
    expect(recent).toHaveLength(8);
    expect(recent[0]).toBe("C3");
    expect(recent.filter((query) => query.toLowerCase() === "c3")).toHaveLength(1);
    expect(recent).not.toContain("a1");
  });

  it("ignores blank searches and can be cleared", () => {
    pushRecentSearch("   ");
    expect(readRecentSearches()).toEqual([]);
    pushRecentSearch("godzilla");
    clearRecentSearches();
    expect(readRecentSearches()).toEqual([]);
  });
});
