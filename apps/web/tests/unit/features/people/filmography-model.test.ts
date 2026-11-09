import { describe, expect, it } from "vitest";
import { toCreditGroups, toCreditLine, toDecades } from "@/features/people/components/person-detail/filmography-model";
import type { PersonCreditItem } from "@/features/people/api";

const credit = (overrides: Partial<PersonCreditItem> = {}): PersonCreditItem => ({
  mediaType: "movie",
  tmdbId: 1,
  title: "Godzilla Minus One",
  originalTitle: null,
  posterPath: null,
  backdropPath: null,
  releaseDate: "2023-11-03",
  releaseYear: 2023,
  character: null,
  jobs: ["Director", "Screenplay", "VFX Supervisor"],
  department: "Directing",
  episodeCount: null,
  voteAverage: 7.6,
  voteCount: 1000,
  ...overrides,
});

const now = new Date(2026, 10, 7);

describe("toCreditLine", () => {
  it("merges a title's jobs into one line", () => {
    expect(toCreditLine(credit(), now)).toEqual({ text: "Director · Screenplay · VFX Supervisor", badges: [] });
  });

  it("reads roles as 'as …', flags voice work and TV episodes", () => {
    expect(
      toCreditLine(credit({ mediaType: "tv", character: "Koichi (voice)", jobs: [], episodeCount: 12 }), now),
    ).toEqual({ text: "as Koichi", badges: ["Voice", "12 ep"] });
  });

  it("marks titles that haven't come out yet", () => {
    expect(toCreditLine(credit({ releaseDate: "2027-05-01", releaseYear: 2027 }), now).badges).toEqual(["Upcoming"]);
  });
});

describe("toDecades", () => {
  it("groups credits by decade, newest first, undated last", () => {
    const decades = toDecades([
      credit({ tmdbId: 1, releaseYear: 2023 }),
      credit({ tmdbId: 2, releaseYear: 2014 }),
      credit({ tmdbId: 3, releaseYear: 2019 }),
      credit({ tmdbId: 4, releaseYear: null, releaseDate: null }),
    ]);
    expect(decades.map((decade) => [decade.label, decade.credits.map((entry) => entry.tmdbId)])).toEqual([
      ["2020s", [1]],
      ["2010s", [2, 3]],
      ["Undated", [4]],
    ]);
  });
});

describe("toCreditGroups", () => {
  const credits = [
    credit({ tmdbId: 1, releaseYear: 1998 }),
    credit({ tmdbId: 2, releaseYear: 2014 }),
    credit({ tmdbId: 3, releaseYear: null, releaseDate: null }),
  ];
  const shape = (groups: ReturnType<typeof toCreditGroups>) =>
    groups.map((group) => [group.label, group.credits.map((entry) => entry.tmdbId)]);

  it("keeps decades in the server's oldest-first order, undated still last", () => {
    expect(shape(toCreditGroups(credits, "oldest"))).toEqual([
      ["1990s", [1]],
      ["2010s", [2]],
      ["Undated", [3]],
    ]);
  });

  it("drops the decade split for most popular", () => {
    expect(shape(toCreditGroups(credits, "popular"))).toEqual([["Most popular", [1, 2, 3]]]);
  });
});
