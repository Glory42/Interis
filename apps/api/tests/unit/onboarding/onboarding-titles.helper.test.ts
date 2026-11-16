import { describe, expect, it } from "bun:test";
import { interleaveTitles } from "../../../src/modules/onboarding/helpers/onboarding-titles.helper";
import type { OnboardingTitle } from "../../../src/modules/onboarding/types/onboarding.types";

const title = (mediaType: "movie" | "tv", tmdbId: number): OnboardingTitle => ({
  mediaType,
  tmdbId,
  title: `${mediaType} ${tmdbId}`,
  posterPath: null,
  year: null,
});

const keys = (titles: OnboardingTitle[]) => titles.map((item) => `${item.mediaType}:${item.tmdbId}`);

describe("interleaveTitles", () => {
  it("takes one from each source in turn", () => {
    const result = interleaveTitles(
      [[title("movie", 1), title("movie", 2)], [title("tv", 1)], [title("movie", 3), title("movie", 4)]],
      10,
    );
    expect(keys(result)).toEqual(["movie:1", "tv:1", "movie:3", "movie:2", "movie:4"]);
  });

  it("shows a title found in two sources once, and keys on media type", () => {
    const result = interleaveTitles([[title("movie", 1), title("tv", 7)], [title("movie", 1), title("movie", 7)]], 10);
    expect(keys(result)).toEqual(["movie:1", "tv:7", "movie:7"]);
  });

  it("stops at the cap", () => {
    const many = Array.from({ length: 20 }, (_, index) => title("movie", index + 1));
    expect(interleaveTitles([many, many], 6)).toHaveLength(6);
    expect(interleaveTitles([], 6)).toEqual([]);
  });
});
