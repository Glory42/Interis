import { describe, expect, it } from "bun:test";
import { selectPersonCredits } from "../../../src/modules/people/helpers/people-credits.helper";
import type { PersonCreditItem } from "../../../src/modules/people/types/people.types";

const credit = (tmdbId: number, releaseDate: string | null, voteCount = 0): PersonCreditItem => ({
  mediaType: "movie",
  tmdbId,
  title: `Film ${tmdbId}`,
  originalTitle: null,
  posterPath: null,
  backdropPath: null,
  releaseDate,
  releaseYear: releaseDate ? Number(releaseDate.slice(0, 4)) : null,
  character: null,
  jobs: ["Director"],
  department: "Directing",
  episodeCount: null,
  voteAverage: null,
  voteCount,
});

// Arrives newest first, undated last, as the normalization service sorts it.
const crew = [
  credit(1, "2027-03-01"),
  credit(2, "2020-05-01", 10),
  credit(3, "2001-01-01", 50),
  credit(4, "2001-01-01", 90),
  credit(5, null, 500),
  credit(6, null, 5),
];

const order = (value: "recent" | "oldest" | "popular") =>
  selectPersonCredits({ cast: [], crew }, { media: "combined", type: "crew", order: value }).map(
    (item) => item.tmdbId,
  );

describe("selectPersonCredits order", () => {
  it("keeps newest first as it arrives", () => {
    expect(order("recent")).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("puts the earliest release first and undated titles last", () => {
    expect(order("oldest")).toEqual([4, 3, 2, 1, 5, 6]);
  });

  it("sorts by vote count for most popular", () => {
    expect(order("popular")).toEqual([5, 4, 3, 2, 6, 1]);
  });
});
