import { describe, expect, it } from "bun:test";
import { computeWatchGoalPace } from "../../../src/modules/watch-goals/helpers/watch-goal-pace.helper";

describe("computeWatchGoalPace", () => {
  it("expects a steady share of the target by today, counting today", () => {
    // Day 73 of 365: 52 * 73 / 365 = 10.4.
    expect(computeWatchGoalPace(52, 10, 2025, "2025-03-14")).toEqual({ status: "on-pace", expected: 10, diff: 0 });
    expect(computeWatchGoalPace(52, 13, 2025, "2025-03-14")).toEqual({ status: "ahead", expected: 10, diff: 3 });
    expect(computeWatchGoalPace(52, 6, 2025, "2025-03-14")).toEqual({ status: "behind", expected: 10, diff: -4 });
  });

  it("uses 366 days in a leap year", () => {
    expect(computeWatchGoalPace(366, 0, 2028, "2028-12-31").expected).toBe(366);
    expect(computeWatchGoalPace(366, 0, 2028, "2028-02-29").expected).toBe(60);
  });

  it("is reached once watched meets the target, in any year", () => {
    expect(computeWatchGoalPace(5, 7, 2025, "2025-02-01")).toEqual({ status: "reached", expected: 5, diff: 2 });
  });

  it("marks past years missed and future years upcoming", () => {
    expect(computeWatchGoalPace(20, 12, 2024, "2025-01-01")).toEqual({ status: "missed", expected: 20, diff: -8 });
    expect(computeWatchGoalPace(20, 0, 2026, "2025-12-31")).toEqual({ status: "upcoming", expected: 0, diff: 0 });
  });
});
