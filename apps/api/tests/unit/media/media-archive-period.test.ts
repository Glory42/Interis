import { describe, expect, it } from "bun:test";
import {
  computeArchivePeriodWindow,
  getGenericTmdbMinVoteCountForPeriod,
  isItemInArchivePeriod,
  type ArchivePeriod,
  type ArchivePeriodWindow,
} from "../../../src/modules/media/helpers/media-archive-period.helper";

describe("computeArchivePeriodWindow", () => {
  it("returns an all-null window for all_time", () => {
    expect(computeArchivePeriodWindow("all_time")).toEqual({
      dateGte: null,
      dateLte: null,
      startYear: null,
      endYear: null,
    });
  });

  it("bounds `today` to a single calendar day", () => {
    const window = computeArchivePeriodWindow("today");
    expect(window.dateGte).toBe(window.dateLte);
    expect(window.dateGte).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(window.startYear).toBe(window.endYear);
  });

  it("starts `this_year` on Jan 1 of the current UTC year", () => {
    const year = new Date().getUTCFullYear();
    const window = computeArchivePeriodWindow("this_year");
    expect(window.dateGte).toBe(`${year}-01-01`);
    expect(window.startYear).toBe(year);
    expect(window.endYear).toBe(year);
  });

  it("spans a 10-year inclusive range for last_10_years", () => {
    const year = new Date().getUTCFullYear();
    const window = computeArchivePeriodWindow("last_10_years");
    expect(window.startYear).toBe(year - 9);
    expect(window.endYear).toBe(year);
    expect(window.dateGte).toBe(`${year - 9}-01-01`);
  });

  it("keeps `this_week` start on or before today", () => {
    const window = computeArchivePeriodWindow("this_week");
    expect(window.dateGte! <= window.dateLte!).toBe(true);
  });
});

describe("isItemInArchivePeriod", () => {
  const window: ArchivePeriodWindow = {
    dateGte: "2026-01-01",
    dateLte: "2026-12-31",
    startYear: 2026,
    endYear: 2026,
  };
  const jan = Date.parse("2026-06-15");

  it("always includes an item when the period is all_time", () => {
    expect(isItemInArchivePeriod(Number.NEGATIVE_INFINITY, null, "all_time", window)).toBe(true);
  });

  it("includes an item whose timestamp falls inside the window", () => {
    expect(isItemInArchivePeriod(jan, 2026, "this_year", window)).toBe(true);
  });

  it("excludes an item whose timestamp falls outside the window", () => {
    expect(isItemInArchivePeriod(Date.parse("2025-06-15"), 2025, "this_year", window)).toBe(false);
  });

  it("excludes an item with no timestamp and no year", () => {
    expect(isItemInArchivePeriod(Number.NEGATIVE_INFINITY, null, "this_year", window)).toBe(false);
  });

  it("excludes a timestamp-less item for the day/week periods even if it has a year", () => {
    expect(isItemInArchivePeriod(Number.NEGATIVE_INFINITY, 2026, "today", window)).toBe(false);
    expect(isItemInArchivePeriod(Number.NEGATIVE_INFINITY, 2026, "this_week", window)).toBe(false);
  });

  it("falls back to a year-range check for a timestamp-less item on year periods", () => {
    expect(isItemInArchivePeriod(Number.NEGATIVE_INFINITY, 2026, "this_year", window)).toBe(true);
    expect(isItemInArchivePeriod(Number.NEGATIVE_INFINITY, 2020, "this_year", window)).toBe(false);
  });

  it("treats an open-ended window bound as unbounded", () => {
    const openEnd: ArchivePeriodWindow = {
      dateGte: "2026-01-01",
      dateLte: null,
      startYear: 2026,
      endYear: null,
    };
    expect(isItemInArchivePeriod(Date.parse("2099-01-01"), 2099, "last_10_years", openEnd)).toBe(
      true,
    );
  });
});

describe("getGenericTmdbMinVoteCountForPeriod", () => {
  const byPeriod: Record<ArchivePeriod, number> = {
    all_time: 300,
    this_year: 100,
    last_10_years: 200,
    this_week: 5,
    today: 1,
  };

  it("uses the per-period floor when sorting by the rating key", () => {
    expect(
      getGenericTmdbMinVoteCountForPeriod("this_year", "rating_tmdb_desc", "rating_tmdb_desc", byPeriod),
    ).toBe(100);
  });

  it("returns 0 for the day/week periods when not sorting by rating", () => {
    expect(
      getGenericTmdbMinVoteCountForPeriod("today", "trending", "rating_tmdb_desc", byPeriod),
    ).toBe(0);
    expect(
      getGenericTmdbMinVoteCountForPeriod("this_week", "trending", "rating_tmdb_desc", byPeriod),
    ).toBe(0);
  });

  it("returns the default floor of 15 for other period/sort combinations", () => {
    expect(
      getGenericTmdbMinVoteCountForPeriod("all_time", "trending", "rating_tmdb_desc", byPeriod),
    ).toBe(15);
  });
});
