import { describe, expect, it } from "bun:test";
import { CreateDiarySchema, UpdateDiarySchema } from "../../../src/modules/diary/dto/diary.dto";
import {
  normalizeDiaryNote,
  normalizeDiaryTag,
  normalizeDiaryTags,
  sanitizeImportedDiaryTags,
} from "../../../src/modules/media/helpers/diary-tag.helper";

describe("normalizeDiaryTag", () => {
  it("trims, lowercases and collapses spaces", () => {
    expect(normalizeDiaryTag("  With   Mom ")).toBe("with mom");
    expect(normalizeDiaryTag("Rewatch-Night")).toBe("rewatch-night");
  });

  it("drops a leading hash", () => {
    expect(normalizeDiaryTag("#cinema")).toBe("cinema");
  });

  it("keeps letters and digits of any script", () => {
    expect(normalizeDiaryTag("Sinema İzmir 2024")).toBe("sinema i̇zmir 2024");
    expect(normalizeDiaryTag("映画館")).toBe("映画館");
  });

  it("rejects empty, too long and unsafe tags", () => {
    expect(normalizeDiaryTag("   ")).toBeNull();
    expect(normalizeDiaryTag("a".repeat(31))).toBeNull();
    expect(normalizeDiaryTag("a".repeat(30))).toBe("a".repeat(30));
    expect(normalizeDiaryTag("<script>")).toBeNull();
    expect(normalizeDiaryTag("a,b")).toBeNull();
    expect(normalizeDiaryTag("-dash-first")).toBeNull();
    expect(normalizeDiaryTag("🎬")).toBeNull();
  });
});

describe("normalizeDiaryTags", () => {
  it("dedupes after normalizing and reports invalid input", () => {
    expect(normalizeDiaryTags(["Cinema", "cinema ", "a/b"])).toEqual({ tags: ["cinema"], invalid: ["a/b"] });
  });
});

describe("sanitizeImportedDiaryTags", () => {
  it("turns odd characters into spaces, drops unusable tags and caps at 10", () => {
    const raw = ["w/ mom", "🎬", ...Array.from({ length: 12 }, (_, index) => `tag${index}`)];
    const tags = sanitizeImportedDiaryTags(raw);
    expect(tags[0]).toBe("w mom");
    expect(tags).toHaveLength(10);
  });
});

describe("normalizeDiaryNote", () => {
  it("treats blank as no note", () => {
    expect(normalizeDiaryNote("   ")).toBeNull();
    expect(normalizeDiaryNote(null)).toBeNull();
    expect(normalizeDiaryNote(" hi ")).toBe("hi");
  });
});

describe("log DTO tags", () => {
  const base = { tmdbId: 1, watchedDate: "2024-01-01" };

  it("normalizes and dedupes tags", () => {
    const parsed = CreateDiarySchema.parse({ ...base, tags: ["Cinema", " cinema", "With Mom"] });
    expect(parsed.tags).toEqual(["cinema", "with mom"]);
  });

  it("rejects more than 10 distinct tags", () => {
    const tags = Array.from({ length: 11 }, (_, index) => `t${index}`);
    expect(CreateDiarySchema.safeParse({ ...base, tags }).success).toBe(false);
  });

  it("accepts 10 distinct tags even with duplicates on top", () => {
    const tags = [...Array.from({ length: 10 }, (_, index) => `t${index}`), "T0"];
    expect(CreateDiarySchema.safeParse({ ...base, tags }).success).toBe(true);
  });

  it("rejects an invalid tag instead of dropping it", () => {
    expect(CreateDiarySchema.safeParse({ ...base, tags: ["ok", "<b>"] }).success).toBe(false);
  });

  it("caps the note at 1000 characters and lets an edit clear it", () => {
    expect(CreateDiarySchema.safeParse({ ...base, note: "x".repeat(1001) }).success).toBe(false);
    expect(UpdateDiarySchema.parse({ note: null }).note).toBeNull();
  });
});
