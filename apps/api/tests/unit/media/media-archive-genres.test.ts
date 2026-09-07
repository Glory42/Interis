import { describe, expect, it } from "bun:test";
import { buildAvailableGenresFromItems } from "../../../src/modules/media/helpers/media-archive-genres.helper";

const withGenres = (...names: string[]) => ({
  genres: names.map((name, index) => ({ id: index + 1, name })),
});

describe("buildAvailableGenresFromItems", () => {
  it("returns an empty list for no items", () => {
    expect(buildAvailableGenresFromItems([])).toEqual([]);
  });

  it("counts how many items each genre appears in", () => {
    const result = buildAvailableGenresFromItems([
      withGenres("Drama", "Comedy"),
      withGenres("Drama"),
    ]);
    expect(result).toEqual([
      { id: 2, name: "Comedy", count: 1 },
      { id: 1, name: "Drama", count: 2 },
    ]);
  });

  it("sorts genres alphabetically by name", () => {
    const result = buildAvailableGenresFromItems([withGenres("Western", "Action", "Mystery")]);
    expect(result.map((g) => g.name)).toEqual(["Action", "Mystery", "Western"]);
  });

  it("counts a genre once per item even when it is listed twice on that item", () => {
    const result = buildAvailableGenresFromItems([withGenres("Drama", "Drama")]);
    expect(result).toEqual([{ id: 1, name: "Drama", count: 1 }]);
  });

  it("treats genre names case-insensitively but keeps the first-seen casing", () => {
    const result = buildAvailableGenresFromItems([withGenres("Sci-Fi"), withGenres("sci-fi")]);
    expect(result).toEqual([{ id: 1, name: "Sci-Fi", count: 2 }]);
  });

  it("trims surrounding whitespace from names", () => {
    const result = buildAvailableGenresFromItems([withGenres("  Horror  ")]);
    expect(result).toEqual([{ id: 1, name: "Horror", count: 1 }]);
  });

  it("skips blank / whitespace-only genre names", () => {
    const result = buildAvailableGenresFromItems([withGenres("", "   ", "Drama")]);
    expect(result).toEqual([{ id: 3, name: "Drama", count: 1 }]);
  });

  it("keeps the id of the first occurrence when a later item has a null id for the same genre", () => {
    const result = buildAvailableGenresFromItems([
      { genres: [{ id: 42, name: "Drama" }] },
      { genres: [{ id: null, name: "Drama" }] },
    ]);
    expect(result).toEqual([{ id: 42, name: "Drama", count: 2 }]);
  });
});
