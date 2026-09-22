import { describe, expect, it } from "bun:test";
import { enrichMissingDirectors } from "../../../src/modules/movies/services/archive/movies-director-enricher.helper";
import type { MovieArchiveItem } from "../../../src/modules/movies/types/movies.types";

const buildItem = (overrides: Partial<MovieArchiveItem> = {}): MovieArchiveItem => ({
  tmdbId: 1,
  title: "Test Movie",
  posterPath: null,
  backdropPath: null,
  releaseDate: null,
  releaseYear: null,
  director: null,
  languageCode: null,
  genres: [],
  primaryGenre: null,
  logCount: 0,
  avgRatingOutOfTen: null,
  tmdbRatingOutOfTen: null,
  tmdbVoteCount: null,
  ratedLogCount: 0,
  viewerHasLogged: false,
  viewerWatchlisted: false,
  ...overrides,
});

describe("enrichMissingDirectors", () => {
  it("leaves items that already have a director untouched, without calling the lookup", async () => {
    const items = [buildItem({ tmdbId: 1, director: "Denis Villeneuve" })];
    let lookupCalls = 0;

    const result = await enrichMissingDirectors(items, {
      lookupDirector: async () => {
        lookupCalls += 1;
        return "Someone Else";
      },
    });

    expect(lookupCalls).toBe(0);
    expect(result[0]?.director).toBe("Denis Villeneuve");
  });

  it("fills in the director and persists it when the lookup succeeds", async () => {
    const items = [buildItem({ tmdbId: 1, director: null })];
    const persisted: Array<{ tmdbId: number; director: string }> = [];

    const result = await enrichMissingDirectors(items, {
      lookupDirector: async () => "Greta Gerwig",
      persistDirector: async (tmdbId, director) => {
        persisted.push({ tmdbId, director });
      },
    });

    expect(result[0]?.director).toBe("Greta Gerwig");
    expect(persisted).toEqual([{ tmdbId: 1, director: "Greta Gerwig" }]);
  });

  it("keeps the item as director: null, without persisting, when the lookup throws", async () => {
    const items = [buildItem({ tmdbId: 1, director: null })];
    let persistCalls = 0;

    const result = await enrichMissingDirectors(items, {
      lookupDirector: async () => {
        throw new Error("TMDB is down");
      },
      persistDirector: async () => {
        persistCalls += 1;
      },
    });

    expect(result[0]?.director).toBeNull();
    expect(persistCalls).toBe(0);
  });

  it("resolves the whole page even when one item's lookup fails and another's succeeds", async () => {
    const items = [
      buildItem({ tmdbId: 1, director: null }),
      buildItem({ tmdbId: 2, director: null }),
      buildItem({ tmdbId: 3, director: "Already Known" }),
    ];

    const result = await enrichMissingDirectors(items, {
      lookupDirector: async (tmdbId) => {
        if (tmdbId === 1) {
          throw new Error("rate limited");
        }
        return "Backfilled Director";
      },
      persistDirector: async () => {},
    });

    expect(result.map((item) => item.director)).toEqual([
      null,
      "Backfilled Director",
      "Already Known",
    ]);
  });

  it("does not call the lookup at all when no items are missing a director", async () => {
    const items = [buildItem({ tmdbId: 1, director: "Known" })];
    let lookupCalls = 0;

    await enrichMissingDirectors(items, {
      lookupDirector: async () => {
        lookupCalls += 1;
        return "x";
      },
    });

    expect(lookupCalls).toBe(0);
  });
});
