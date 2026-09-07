import { describe, expect, it } from "bun:test";
import {
  sortArchiveItemsGeneric,
  type ArchiveSortKind,
} from "../../../src/modules/media/helpers/media-archive-sort.helper";

type Item = {
  key: string;
  date: number;
  logCount: number;
  avgRatingOutOfTen: number | null;
  ratedLogCount: number;
  title: string;
  tmdbRatingOutOfTen: number | null;
  tmdbVoteCount: number | null;
};

const item = (over: Partial<Item> & { key: string }): Item => ({
  date: 0,
  logCount: 0,
  avgRatingOutOfTen: null,
  ratedLogCount: 0,
  title: "Untitled",
  tmdbRatingOutOfTen: null,
  tmdbVoteCount: null,
  ...over,
});

const compareDateDesc = (a: Item, b: Item) => b.date - a.date;
const compareDateAsc = (a: Item, b: Item) => a.date - b.date;

const sortKeys = (items: Item[], kind: ArchiveSortKind) =>
  sortArchiveItemsGeneric(items, kind, compareDateDesc, compareDateAsc, 50).map((i) => i.key);

describe("sortArchiveItemsGeneric", () => {
  it("does not mutate the input", () => {
    const items = [item({ key: "a", logCount: 1 }), item({ key: "b", logCount: 2 })];
    sortArchiveItemsGeneric(items, "trending", compareDateDesc, compareDateAsc, 50);
    expect(items.map((i) => i.key)).toEqual(["a", "b"]);
  });

  describe("trending", () => {
    it("orders by logCount desc, then avgRating desc, then date desc", () => {
      const items = [
        item({ key: "low-logs", logCount: 1, avgRatingOutOfTen: 10 }),
        item({ key: "hi-logs-lo-rating", logCount: 5, avgRatingOutOfTen: 2 }),
        item({ key: "hi-logs-hi-rating", logCount: 5, avgRatingOutOfTen: 9 }),
        item({ key: "hi-logs-hi-rating-newer", logCount: 5, avgRatingOutOfTen: 9, date: 100 }),
      ];
      expect(sortKeys(items, "trending")).toEqual([
        "hi-logs-hi-rating-newer",
        "hi-logs-hi-rating",
        "hi-logs-lo-rating",
        "low-logs",
      ]);
    });

    it("treats a null avgRating as worse than any real rating", () => {
      const items = [
        item({ key: "null-rating", logCount: 3, avgRatingOutOfTen: null }),
        item({ key: "zero-rating", logCount: 3, avgRatingOutOfTen: 0 }),
      ];
      expect(sortKeys(items, "trending")).toEqual(["zero-rating", "null-rating"]);
    });
  });

  it("date_desc / date_asc delegate to the supplied comparators", () => {
    const items = [item({ key: "old", date: 1 }), item({ key: "new", date: 9 })];
    expect(sortKeys(items, "date_desc")).toEqual(["new", "old"]);
    expect(sortKeys(items, "date_asc")).toEqual(["old", "new"]);
  });

  it("logs_desc orders by logCount then date desc", () => {
    const items = [
      item({ key: "a", logCount: 2, date: 1 }),
      item({ key: "b", logCount: 2, date: 5 }),
      item({ key: "c", logCount: 9 }),
    ];
    expect(sortKeys(items, "logs_desc")).toEqual(["c", "b", "a"]);
  });

  describe("rating_user_desc", () => {
    it("sinks null user ratings below rated items", () => {
      const items = [
        item({ key: "unrated", avgRatingOutOfTen: null }),
        item({ key: "rated-low", avgRatingOutOfTen: 3 }),
      ];
      expect(sortKeys(items, "rating_user_desc")).toEqual(["rated-low", "unrated"]);
    });

    it("breaks equal ratings by ratedLogCount, then date desc", () => {
      const items = [
        item({ key: "few-logs", avgRatingOutOfTen: 8, ratedLogCount: 1, date: 5 }),
        item({ key: "many-logs", avgRatingOutOfTen: 8, ratedLogCount: 10, date: 1 }),
      ];
      expect(sortKeys(items, "rating_user_desc")).toEqual(["many-logs", "few-logs"]);
    });
  });

  it("rating_tmdb_desc sinks items with no tmdb rating and applies the weighted score", () => {
    const items = [
      item({ key: "no-tmdb", tmdbRatingOutOfTen: null, tmdbVoteCount: null }),
      item({ key: "high", tmdbRatingOutOfTen: 9, tmdbVoteCount: 5000 }),
      item({ key: "low-confidence", tmdbRatingOutOfTen: 10, tmdbVoteCount: 3 }),
    ];
    const result = sortKeys(items, "rating_tmdb_desc");
    expect(result[0]).toBe("high");
    expect(result[2]).toBe("no-tmdb");
  });

  it("falls back to title_asc for any other sort kind, tie-broken by date desc", () => {
    const items = [
      item({ key: "b", title: "Banana" }),
      item({ key: "a1", title: "Apple", date: 1 }),
      item({ key: "a2", title: "Apple", date: 9 }),
    ];
    expect(sortKeys(items, "title_asc")).toEqual(["a2", "a1", "b"]);
  });
});
