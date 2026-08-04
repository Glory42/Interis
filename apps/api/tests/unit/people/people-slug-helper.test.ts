import { describe, expect, it } from "bun:test";
import {
  inferRoleHintsFromKnownForDepartment,
  mergeRoleHints,
  normalizePersonRouteSlug,
  slugifyPersonName,
} from "../../../src/modules/people/helpers/people-slug.helper";

describe("slugifyPersonName", () => {
  it("lowercases and hyphenates a plain name", () => {
    expect(slugifyPersonName("Jane Doe")).toBe("jane-doe");
  });

  it("strips combining diacritics (NFKD-decomposable accents)", () => {
    expect(slugifyPersonName("José García")).toBe("jose-garcia");
  });

  it("replaces letters with no diacritic decomposition (e.g. Icelandic ð) with a hyphen", () => {
    expect(slugifyPersonName("Guðmundsdóttir")).toBe("gu-mundsdottir");
  });

  it("collapses punctuation into single hyphens and trims edges", () => {
    expect(slugifyPersonName("  O'Brien & Sons!! ")).toBe("o-brien-sons");
  });

  it("falls back to 'person' when nothing survives normalization", () => {
    expect(slugifyPersonName("!!!")).toBe("person");
  });
});

describe("normalizePersonRouteSlug", () => {
  it("accepts a well-formed slug unchanged", () => {
    expect(normalizePersonRouteSlug("jane-doe")).toBe("jane-doe");
  });

  it("lowercases and trims", () => {
    expect(normalizePersonRouteSlug("  Jane-Doe  ")).toBe("jane-doe");
  });

  it("collapses repeated hyphens", () => {
    expect(normalizePersonRouteSlug("jane---doe")).toBe("jane-doe");
  });

  it("rejects a slug containing invalid characters", () => {
    expect(normalizePersonRouteSlug("jane_doe!")).toBeNull();
  });

  it("rejects an empty slug", () => {
    expect(normalizePersonRouteSlug("   ")).toBeNull();
  });
});

describe("inferRoleHintsFromKnownForDepartment", () => {
  it("infers actor for Acting", () => {
    expect(inferRoleHintsFromKnownForDepartment("Acting")).toEqual(["actor"]);
  });

  it("infers director for Directing, Writing, Production, and Creator", () => {
    for (const department of ["Directing", "Writing", "Production", "Creator", "Crew"]) {
      expect(inferRoleHintsFromKnownForDepartment(department)).toEqual(["director"]);
    }
  });

  it("returns an empty array for an unrecognized or missing department", () => {
    expect(inferRoleHintsFromKnownForDepartment("Sound")).toEqual([]);
    expect(inferRoleHintsFromKnownForDepartment(null)).toEqual([]);
    expect(inferRoleHintsFromKnownForDepartment(undefined)).toEqual([]);
  });

  it("is case-insensitive", () => {
    expect(inferRoleHintsFromKnownForDepartment("acting")).toEqual(["actor"]);
  });
});

describe("mergeRoleHints", () => {
  it("dedupes across multiple lists while preserving first-seen order", () => {
    expect(mergeRoleHints(["actor"], ["director"], ["actor"])).toEqual(["actor", "director"]);
  });

  it("returns an empty array when given no hints", () => {
    expect(mergeRoleHints([], [])).toEqual([]);
  });
});
