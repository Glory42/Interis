import { describe, expect, it } from "bun:test";
import {
  compareMediaTimestampsAsc,
  normalizeGenres,
  toMediaTimestamp,
} from "../../../src/modules/media/helpers/media-format.helper";

describe("toMediaTimestamp", () => {
  it("parses a valid date string", () => {
    expect(toMediaTimestamp("2020-05-01", null)).toBe(Date.parse("2020-05-01"));
  });

  it("falls back to January 1st of the year when the date is unparseable", () => {
    expect(toMediaTimestamp("not-a-date", 2015)).toBe(Date.UTC(2015, 0, 1));
  });

  it("falls back to January 1st of the year when there is no date at all", () => {
    expect(toMediaTimestamp(null, 1999)).toBe(Date.UTC(1999, 0, 1));
  });

  it("returns negative infinity when neither a date nor a year is available", () => {
    expect(toMediaTimestamp(null, null)).toBe(Number.NEGATIVE_INFINITY);
  });
});

describe("compareMediaTimestampsAsc", () => {
  it("sorts an item with a missing timestamp after one with a real timestamp", () => {
    const result = compareMediaTimestampsAsc(Number.NEGATIVE_INFINITY, 1000, "A", "B");
    expect(result).toBeGreaterThan(0);
  });

  it("sorts an item with a real timestamp before one with a missing timestamp", () => {
    const result = compareMediaTimestampsAsc(1000, Number.NEGATIVE_INFINITY, "A", "B");
    expect(result).toBeLessThan(0);
  });

  it("orders by timestamp when both are resolvable", () => {
    expect(compareMediaTimestampsAsc(1000, 2000, "B", "A")).toBeLessThan(0);
  });

  it("breaks a timestamp tie alphabetically by title", () => {
    expect(compareMediaTimestampsAsc(1000, 1000, "Zeta", "Alpha")).toBeGreaterThan(0);
    expect(compareMediaTimestampsAsc(1000, 1000, "Alpha", "Zeta")).toBeLessThan(0);
  });
});

describe("normalizeGenres", () => {
  it("returns an empty array for non-array input", () => {
    expect(normalizeGenres(undefined)).toEqual([]);
    expect(normalizeGenres("not an array")).toEqual([]);
  });

  it("keeps only well-formed {id, name} entries", () => {
    const result = normalizeGenres([
      { id: 1, name: "Drama" },
      { id: "bad-id", name: "Comedy" },
      { name: "missing id" },
      null,
      { id: 2, name: "Action" },
    ]);

    expect(result).toEqual([
      { id: 1, name: "Drama" },
      { id: 2, name: "Action" },
    ]);
  });
});
