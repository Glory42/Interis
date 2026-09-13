import { describe, expect, it } from "vitest";
import {
  buildArchiveSearchParams,
  buildDetailSearchParams,
  clampPositiveInt,
  normalizeSearchQuery,
} from "@/lib/query-params";

describe("clampPositiveInt", () => {
  it("floors fractional values", () => {
    expect(clampPositiveInt(3.9)).toBe(3);
  });

  it("raises anything below 1 up to 1", () => {
    expect(clampPositiveInt(0)).toBe(1);
    expect(clampPositiveInt(-5)).toBe(1);
  });
});

describe("normalizeSearchQuery", () => {
  it("trims surrounding whitespace", () => {
    expect(normalizeSearchQuery("  dune  ")).toBe("dune");
  });
});

describe("buildArchiveSearchParams", () => {
  it("returns no params for an empty input", () => {
    expect(buildArchiveSearchParams({}).toString()).toBe("");
  });

  it("trims and includes genre / language", () => {
    const params = buildArchiveSearchParams({ genre: "  Drama ", language: " en " });
    expect(params.get("genre")).toBe("Drama");
    expect(params.get("language")).toBe("en");
  });

  it("omits whitespace-only genre / language", () => {
    const params = buildArchiveSearchParams({ genre: "   ", language: "" });
    expect(params.has("genre")).toBe(false);
    expect(params.has("language")).toBe(false);
  });

  it("passes sort and period through verbatim", () => {
    const params = buildArchiveSearchParams({ sort: "rating_tmdb_desc", period: "this_year" });
    expect(params.get("sort")).toBe("rating_tmdb_desc");
    expect(params.get("period")).toBe("this_year");
  });

  it("clamps page and limit to positive integers", () => {
    const params = buildArchiveSearchParams({ page: 2.7, limit: 0 });
    expect(params.get("page")).toBe("2");
    expect(params.get("limit")).toBe("1");
  });

  it("omits page / limit that are not finite numbers", () => {
    const params = buildArchiveSearchParams({ page: Number.NaN, limit: Number.POSITIVE_INFINITY });
    expect(params.has("page")).toBe(false);
    expect(params.has("limit")).toBe(false);
  });
});

describe("buildDetailSearchParams", () => {
  it("includes reviewsSort when provided", () => {
    expect(buildDetailSearchParams({ reviewsSort: "recent" }).get("reviewsSort")).toBe("recent");
  });

  it("returns no params when reviewsSort is absent", () => {
    expect(buildDetailSearchParams({}).toString()).toBe("");
  });

  it("clamps reviewsPage and reviewsLimit to positive integers", () => {
    const params = buildDetailSearchParams({ reviewsPage: 2.7, reviewsLimit: 0 });
    expect(params.get("reviewsPage")).toBe("2");
    expect(params.get("reviewsLimit")).toBe("1");
  });

  it("omits reviewsPage / reviewsLimit that are not finite numbers", () => {
    const params = buildDetailSearchParams({ reviewsPage: Number.NaN, reviewsLimit: Infinity });
    expect(params.has("reviewsPage")).toBe(false);
    expect(params.has("reviewsLimit")).toBe(false);
  });
});
