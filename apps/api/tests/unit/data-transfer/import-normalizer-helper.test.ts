import { describe, expect, it } from "bun:test";
import {
  detectFormat,
  normalizeInterisRow,
  normalizeLetterboxdRatingsRow,
  normalizeLetterboxdRow,
  normalizeLetterboxdWatchedRow,
  parseDate,
  parseRating,
  parseRewatch,
  runPool,
  toRatingOutOfTen,
} from "../../../src/modules/data-transfer/helpers/import-normalizer.helper";

describe("detectFormat", () => {
  it("recognizes the Interis export format", () => {
    expect(detectFormat(["TmdbId", "WatchedDate", "Title"])).toBe("interis");
  });

  it("recognizes the Letterboxd diary format", () => {
    expect(detectFormat(["Name", "Watched Date"])).toBe("letterboxd");
  });

  it("recognizes Letterboxd watchlist.csv by filename", () => {
    expect(detectFormat(["Name", "Date", "Year"], "watchlist.csv")).toBe(
      "letterboxd-watchlist",
    );
  });

  it("recognizes Letterboxd ratings.csv by the Rating column", () => {
    expect(detectFormat(["Name", "Date", "Year", "Rating"])).toBe("letterboxd-ratings");
  });

  it("recognizes Letterboxd ratings.csv by filename when there's no Rating column", () => {
    expect(detectFormat(["Name", "Date", "Year"], "ratings.csv")).toBe("letterboxd-ratings");
  });

  it("falls back to watched.csv for the generic Name/Date/Year shape", () => {
    expect(detectFormat(["Name", "Date", "Year"], "watched.csv")).toBe("letterboxd-watched");
  });

  it("returns unknown for an unrecognized header shape", () => {
    expect(detectFormat(["Foo", "Bar"])).toBe("unknown");
  });
});

describe("parseRating", () => {
  it("clamps into the 0.5-5 range", () => {
    expect(parseRating("10")).toBe(5);
    expect(parseRating("0.1")).toBe(0.5);
  });

  it("rounds to the nearest half-star", () => {
    expect(parseRating("3.3")).toBe(3.5);
    expect(parseRating("3.2")).toBe(3);
  });

  it("returns null for zero, negative, or non-numeric input", () => {
    expect(parseRating("0")).toBeNull();
    expect(parseRating("-1")).toBeNull();
    expect(parseRating("not-a-number")).toBeNull();
    expect(parseRating("")).toBeNull();
  });
});

describe("toRatingOutOfTen", () => {
  it("doubles a 5-star rating into a 10-point scale", () => {
    expect(toRatingOutOfTen(4.5)).toBe(9);
  });

  it("passes through null", () => {
    expect(toRatingOutOfTen(null)).toBeNull();
  });
});

describe("parseDate", () => {
  it("accepts a well-formed ISO date", () => {
    expect(parseDate("2024-05-01")).toBe("2024-05-01");
  });

  it("rejects malformed or empty input", () => {
    expect(parseDate("05/01/2024")).toBeNull();
    expect(parseDate("")).toBeNull();
    expect(parseDate("2024-5-1")).toBeNull();
  });
});

describe("parseRewatch", () => {
  it("accepts case-insensitive yes/true", () => {
    expect(parseRewatch("Yes")).toBe(true);
    expect(parseRewatch("TRUE")).toBe(true);
  });

  it("treats anything else as false", () => {
    expect(parseRewatch("no")).toBe(false);
    expect(parseRewatch("")).toBe(false);
  });
});

describe("normalizeLetterboxdRow (diary.csv)", () => {
  it("normalizes a full row", () => {
    const row = normalizeLetterboxdRow({
      Name: "Fight Club",
      Year: "1999",
      "Watched Date": "2024-01-15",
      Rating: "4.5",
      Rewatch: "Yes",
      Review: "Great film",
    });
    expect(row).toEqual({
      title: "Fight Club",
      year: 1999,
      tmdbId: null,
      mediaType: "movie",
      watchedDate: "2024-01-15",
      rating: 4.5,
      rewatch: true,
      review: "Great film",
      spoilers: false,
    });
  });

  it("falls back to the Date column when Watched Date is absent", () => {
    const row = normalizeLetterboxdRow({ Name: "Film", Date: "2024-01-15" });
    expect(row?.watchedDate).toBe("2024-01-15");
  });

  it("returns null without a valid date", () => {
    expect(normalizeLetterboxdRow({ Name: "Film" })).toBeNull();
  });

  it("returns null without a title", () => {
    expect(normalizeLetterboxdRow({ "Watched Date": "2024-01-15" })).toBeNull();
  });
});

describe("normalizeLetterboxdWatchedRow (watched.csv)", () => {
  it("never carries a rating, even if present in the row", () => {
    const row = normalizeLetterboxdWatchedRow({
      Name: "Film",
      Date: "2024-01-15",
      Rating: "5",
    });
    expect(row?.rating).toBeNull();
  });
});

describe("normalizeLetterboxdRatingsRow (ratings.csv)", () => {
  it("requires a non-zero rating, unlike watched.csv", () => {
    expect(
      normalizeLetterboxdRatingsRow({ Name: "Film", Date: "2024-01-15", Rating: "0" }),
    ).toBeNull();
  });

  it("normalizes a rated row", () => {
    const row = normalizeLetterboxdRatingsRow({
      Name: "Film",
      Date: "2024-01-15",
      Rating: "4",
    });
    expect(row?.rating).toBe(4);
  });
});

describe("normalizeInterisRow", () => {
  it("carries through tmdbId and mediaType from the export", () => {
    const row = normalizeInterisRow({
      Title: "Breaking Bad",
      TmdbId: "1396",
      MediaType: "tv",
      WatchedDate: "2024-01-15",
      Rating: "5",
      Spoilers: "true",
    });
    expect(row).toMatchObject({
      title: "Breaking Bad",
      tmdbId: 1396,
      mediaType: "tv",
      spoilers: true,
    });
  });

  it("defaults mediaType to movie for anything other than 'tv'", () => {
    const row = normalizeInterisRow({ Title: "Film", WatchedDate: "2024-01-15" });
    expect(row?.mediaType).toBe("movie");
  });

  it("returns null without a title or watched date", () => {
    expect(normalizeInterisRow({ WatchedDate: "2024-01-15" })).toBeNull();
    expect(normalizeInterisRow({ Title: "Film" })).toBeNull();
  });
});

describe("runPool", () => {
  it("runs every task exactly once", async () => {
    const results: number[] = [];
    const tasks = Array.from({ length: 10 }, (_, i) => async () => {
      results.push(i);
    });

    await runPool(tasks, 3);

    expect(results.sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("never runs more than `concurrency` tasks at once", async () => {
    let active = 0;
    let maxActive = 0;
    const tasks = Array.from({ length: 8 }, () => async () => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
    });

    await runPool(tasks, 2);

    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it("resolves immediately for an empty task list", async () => {
    await expect(runPool([], 5)).resolves.toBeUndefined();
  });
});
