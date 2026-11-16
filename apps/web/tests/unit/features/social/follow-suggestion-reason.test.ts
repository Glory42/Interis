import { describe, expect, it } from "vitest";
import { formatSuggestionReason } from "@/features/social/follow-suggestion-reason";

describe("formatSuggestionReason", () => {
  it("names the title you agree on first", () => {
    expect(formatSuggestionReason({ sharedCount: 6, agreeTitle: "The Thing", followerCount: 0 })).toBe(
      "Agrees on The Thing · 6 titles in common",
    );
    expect(formatSuggestionReason({ sharedCount: 1, agreeTitle: "Heat", followerCount: 0 })).toBe("Agrees on Heat");
  });

  it("counts shared titles, then falls back to popularity", () => {
    expect(formatSuggestionReason({ sharedCount: 6, agreeTitle: null, followerCount: 0 })).toBe("Watched 6 of your titles");
    expect(formatSuggestionReason({ sharedCount: 1, agreeTitle: null, followerCount: 0 })).toBe("Watched one of your titles");
    expect(formatSuggestionReason({ sharedCount: 0, agreeTitle: null, followerCount: 1 })).toBe(
      "Popular on Interis · 1 follower",
    );
    expect(formatSuggestionReason({ sharedCount: 0, agreeTitle: null, followerCount: 0 })).toBe("Active on Interis");
  });
});
