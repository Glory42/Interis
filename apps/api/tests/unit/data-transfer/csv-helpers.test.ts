import { describe, expect, it } from "bun:test";
import { buildCsv } from "../../../src/modules/data-transfer/helpers/csv-builder";
import { getCsvHeaders, parseCsv } from "../../../src/modules/data-transfer/helpers/csv-parser";

describe("parseCsv", () => {
  it("parses simple rows into header-keyed objects", () => {
    const rows = parseCsv("Name,Year\nFight Club,1999\nSeven,1995\n");
    expect(rows).toEqual([
      { Name: "Fight Club", Year: "1999" },
      { Name: "Seven", Year: "1995" },
    ]);
  });

  it("handles quoted fields containing commas", () => {
    const rows = parseCsv('Name,Note\n"Se7en, the movie",classic\n');
    expect(rows).toEqual([{ Name: "Se7en, the movie", Note: "classic" }]);
  });

  it("handles escaped double quotes inside quoted fields", () => {
    const rows = parseCsv('Name,Note\n"He said ""hi""",ok\n');
    expect(rows).toEqual([{ Name: 'He said "hi"', Note: "ok" }]);
  });

  it("handles embedded newlines inside quoted fields", () => {
    const rows = parseCsv('Name,Review\nFilm,"Line one\nLine two"\n');
    expect(rows).toEqual([{ Name: "Film", Review: "Line one\nLine two" }]);
  });

  it("normalizes CRLF line endings", () => {
    const rows = parseCsv("Name,Year\r\nFilm,2020\r\n");
    expect(rows).toEqual([{ Name: "Film", Year: "2020" }]);
  });

  it("skips blank trailing rows", () => {
    const rows = parseCsv("Name,Year\nFilm,2020\n\n");
    expect(rows).toEqual([{ Name: "Film", Year: "2020" }]);
  });

  it("returns an empty array when there's only a header row or nothing at all", () => {
    expect(parseCsv("Name,Year\n")).toEqual([]);
    expect(parseCsv("")).toEqual([]);
  });

  it("fills missing trailing columns with an empty string", () => {
    const rows = parseCsv("Name,Year,Rating\nFilm,2020\n");
    expect(rows).toEqual([{ Name: "Film", Year: "2020", Rating: "" }]);
  });
});

describe("getCsvHeaders", () => {
  it("splits and trims the first line", () => {
    expect(getCsvHeaders("Name, Year ,Rating\nFilm,2020,8\n")).toEqual([
      "Name",
      "Year",
      "Rating",
    ]);
  });

  it("strips surrounding quotes from header cells", () => {
    expect(getCsvHeaders('"Name","Year"\n')).toEqual(["Name", "Year"]);
  });

  it("returns an empty-string single header for an empty input", () => {
    expect(getCsvHeaders("")).toEqual([""]);
  });
});

describe("buildCsv", () => {
  it("builds a header row plus one row per input", () => {
    const csv = buildCsv(["Name", "Year"], [{ Name: "Film", Year: "2020" }]);
    expect(csv).toBe("Name,Year\nFilm,2020\n");
  });

  it("quotes and escapes fields containing commas, quotes, or newlines", () => {
    const csv = buildCsv(
      ["Name"],
      [{ Name: 'A "great" film, really' }, { Name: "Multi\nline" }],
    );
    expect(csv).toBe('Name\n"A ""great"" film, really"\n"Multi\nline"\n');
  });

  it("fills a missing column with an empty string", () => {
    const csv = buildCsv(["Name", "Rating"], [{ Name: "Film" }]);
    expect(csv).toBe("Name,Rating\nFilm,\n");
  });

  it("round-trips through parseCsv", () => {
    const original = [
      { Name: "Film, the sequel", Review: 'Great, "loved" it\nreally' },
      { Name: "Simple", Review: "fine" },
    ];
    const csv = buildCsv(["Name", "Review"], original);
    expect(parseCsv(csv)).toEqual(original);
  });
});
