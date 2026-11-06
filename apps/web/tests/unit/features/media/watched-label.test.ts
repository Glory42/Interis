import { describe, expect, it } from "vitest";
import { formatWatchedLabel } from "@/features/media/detail/watched-label";

describe("formatWatchedLabel", () => {
  const now = new Date("2026-11-07T12:00:00Z");

  it("drops the year for this year's watches", () => {
    expect(formatWatchedLabel("2026-11-02", now)).toBe("Watched Nov 2");
  });

  it("keeps the year for older watches", () => {
    expect(formatWatchedLabel("2024-03-04", now)).toBe("Watched Mar 4, 2024");
  });

  it("says nothing without a date", () => {
    expect(formatWatchedLabel(null, now)).toBeNull();
  });
});
