import { describe, expect, it } from "vitest";
import {
  formatDateOnlyLabel,
  formatRelativeTime,
  parseDateOnly,
  todayAsLocalDateInput,
} from "@/lib/time";

const agoISO = (ms: number) => new Date(Date.now() - ms).toISOString();
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatRelativeTime", () => {
  it("returns the raw value for an unparseable date", () => {
    expect(formatRelativeTime("nonsense")).toBe("nonsense");
  });

  it("reports minutes and hours", () => {
    expect(formatRelativeTime(agoISO(5 * MINUTE))).toBe("5 minutes ago");
    expect(formatRelativeTime(agoISO(3 * HOUR))).toBe("3 hours ago");
  });

  it("stops at days by default even for far-past dates", () => {
    expect(formatRelativeTime(agoISO(400 * DAY))).toMatch(/day/);
  });

  it("rolls up to months and years when maxUnit is 'year'", () => {
    expect(formatRelativeTime(agoISO(40 * DAY), { maxUnit: "year" })).toMatch(/month/);
    expect(formatRelativeTime(agoISO(400 * DAY), { maxUnit: "year" })).toMatch(/year/);
  });
});

describe("parseDateOnly", () => {
  it("parses a YYYY-MM-DD value at local midnight (not UTC)", () => {
    const date = parseDateOnly("2026-03-15");
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(2);
    expect(date.getDate()).toBe(15);
    expect(date.getHours()).toBe(0);
  });
});

describe("todayAsLocalDateInput", () => {
  it("returns the viewer's local calendar date as YYYY-MM-DD", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate(),
    ).padStart(2, "0")}`;
    expect(todayAsLocalDateInput()).toBe(expected);
  });
});

describe("formatDateOnlyLabel", () => {
  it("formats a date-only value without shifting the day across timezones", () => {
    const label = formatDateOnlyLabel("2026-03-15");
    expect(label).toContain("2026");
    expect(label).toContain("15");
  });
});
