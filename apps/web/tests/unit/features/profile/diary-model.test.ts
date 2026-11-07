import { describe, expect, it } from "vitest";
import type { DiaryItem } from "@/features/profile/api";
import { toDiaryMonths, toDiaryRows } from "@/features/profile/components/diary/diary-model";

const diaryItem = (id: string, mediaType: DiaryItem["mediaType"], liked: boolean): DiaryItem => ({
  id,
  mediaType,
  watchedDate: "2026-02-03",
  rating: null,
  rewatch: false,
  liked,
  createdAt: "2026-02-03T12:00:00.000Z",
  updatedAt: "2026-02-03T12:00:00.000Z",
  media: { tmdbId: Number(id), title: `Title ${id}`, posterPath: null, releaseYear: 2020 },
  review: null,
});

describe("toDiaryRows", () => {
  it("marks rows liked from each entry's own liked flag, series included", () => {
    const rows = toDiaryRows([
      diaryItem("1", "tv", true),
      diaryItem("2", "movie", true),
      diaryItem("3", "movie", false),
    ]);

    expect(rows.map((row) => row.isLiked)).toEqual([true, true, false]);
  });
});

const on = (id: string, watchedDate: string): DiaryItem => ({ ...diaryItem(id, "movie", false), watchedDate });

describe("toDiaryMonths", () => {
  it("groups the log by month with a count, and shows each day once", () => {
    const months = toDiaryMonths(
      toDiaryRows([on("1", "2026-11-02"), on("2", "2026-11-02"), on("3", "2026-10-28")]),
      false,
    );

    expect(months.map((month) => [month.label, month.count])).toEqual([
      ["NOVEMBER 2026", 1 + 1],
      ["OCTOBER 2026", 1],
    ]);
    expect(months[0]!.rows.map((row) => row.dayLabel)).toEqual([{ day: "02", weekday: "MON" }, null]);
    expect(months[1]!.rows[0]!.dayLabel).toEqual({ day: "28", weekday: "WED" });
  });

  it("leaves the last month uncounted while older entries are still unloaded", () => {
    const months = toDiaryMonths(toDiaryRows([on("1", "2026-11-02"), on("2", "2026-10-28")]), true);
    expect(months.map((month) => month.count)).toEqual([1, null]);
  });
});
