import { describe, expect, it } from "vitest";
import { heatLevelFor, toDayHeatmap } from "@/features/profile/components/stats/day-heatmap-model";

// Sat Nov 7 2026; Jan 1 2026 is a Thursday.
const now = new Date(2026, 10, 7, 18, 30);

describe("toDayHeatmap", () => {
  const weeks = toDayHeatmap(
    [
      { day: "2026-01-01", count: 1 },
      { day: "2026-03-09", count: 3 },
      { day: "2026-11-07", count: 9 },
    ],
    now,
  );

  it("runs Monday-first week columns across the whole year", () => {
    expect(weeks).toHaveLength(53);
    expect(weeks[0]!.key).toBe("2025-12-29");
    expect(weeks.at(-1)!.key).toBe("2026-12-28");
    expect(weeks.every((week) => week.days.length === 7)).toBe(true);
  });

  it("leaves other years' days empty and marks days still to come", () => {
    expect(weeks[0]!.days.slice(0, 3)).toEqual([null, null, null]);
    expect(weeks[0]!.days[3]).toEqual({ key: "2026-01-01", label: "1 log on Thu, Jan 1", count: 1, level: 1 });
    expect(weeks.at(-1)!.days.slice(4)).toEqual([null, null, null]);
    const days = weeks.flatMap((week) => week.days);
    expect(days.find((day) => day?.key === "2026-11-07")).toMatchObject({ count: 9, level: 4 });
    expect(days.find((day) => day?.key === "2026-11-07")).not.toHaveProperty("future");
    expect(days.find((day) => day?.key === "2026-11-08")).toEqual({ key: "2026-11-08", label: "", count: 0, level: 0, future: true });
  });

  it("labels every day, including empty ones", () => {
    const march9 = weeks.flatMap((week) => week.days).find((day) => day?.key === "2026-03-09");
    expect(march9?.label).toBe("3 logs on Mon, Mar 9");
    expect(weeks[1]!.days[0]).toMatchObject({ key: "2026-01-05", label: "0 logs on Mon, Jan 5", level: 0 });
  });

  it("names each month once, on its first column", () => {
    const months = weeks.map((week) => week.month).filter(Boolean);
    expect(months).toEqual(["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]);
    expect(weeks[0]!.month).toBe("Jan");
  });
});

describe("heatLevelFor", () => {
  it("buckets 0, 1, 2, 3 and 4+ logs", () => {
    expect([0, 1, 2, 3, 4, 12].map(heatLevelFor)).toEqual([0, 1, 2, 3, 4, 4]);
  });
});
