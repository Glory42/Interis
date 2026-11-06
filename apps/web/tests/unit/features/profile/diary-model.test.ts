import { describe, expect, it } from "vitest";
import type { DiaryItem } from "@/features/profile/api";
import { toDiaryRows } from "@/features/profile/components/diary/diary-model";

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
