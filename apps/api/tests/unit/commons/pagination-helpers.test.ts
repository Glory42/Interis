import { describe, expect, it } from "bun:test";
import { normalizeBoundedLimit } from "../../../src/commons/helpers/pagination.helper";
import { applyOptionalPagination } from "../../../src/commons/helpers/db-pagination.helper";
import { parseIntParam } from "../../../src/commons/helpers/parse-int-param.helper";

describe("normalizeBoundedLimit", () => {
  const options = { default: 20, max: 100 };

  it("falls back to the default when the limit is undefined", () => {
    expect(normalizeBoundedLimit(undefined, options)).toBe(20);
  });

  it("falls back to the default when the limit is zero", () => {
    expect(normalizeBoundedLimit(0, options)).toBe(20);
  });

  it("falls back to the default when the limit is NaN", () => {
    expect(normalizeBoundedLimit(Number.NaN, options)).toBe(20);
  });

  it("passes an in-range limit through unchanged", () => {
    expect(normalizeBoundedLimit(50, options)).toBe(50);
  });

  it("caps a limit above max", () => {
    expect(normalizeBoundedLimit(5000, options)).toBe(100);
  });

  it("raises a negative limit up to 1", () => {
    expect(normalizeBoundedLimit(-10, options)).toBe(1);
  });

  it("keeps a limit of exactly max", () => {
    expect(normalizeBoundedLimit(100, options)).toBe(100);
  });
});

describe("applyOptionalPagination", () => {
  const makeQuery = () => {
    const calls: Array<[string, number]> = [];
    const query = {
      calls,
      limit(count: number) {
        calls.push(["limit", count]);
        return query;
      },
      offset(count: number) {
        calls.push(["offset", count]);
        return query;
      },
    };
    return query;
  };

  it("applies neither when both are undefined", () => {
    const query = makeQuery();
    applyOptionalPagination(query);
    expect(query.calls).toEqual([]);
  });

  it("applies only limit when offset is undefined", () => {
    const query = makeQuery();
    applyOptionalPagination(query, 10);
    expect(query.calls).toEqual([["limit", 10]]);
  });

  it("applies only offset when limit is undefined", () => {
    const query = makeQuery();
    applyOptionalPagination(query, undefined, 30);
    expect(query.calls).toEqual([["offset", 30]]);
  });

  it("applies a zero offset (not treated as absent)", () => {
    const query = makeQuery();
    applyOptionalPagination(query, undefined, 0);
    expect(query.calls).toEqual([["offset", 0]]);
  });

  it("applies both in limit-then-offset order", () => {
    const query = makeQuery();
    applyOptionalPagination(query, 10, 20);
    expect(query.calls).toEqual([
      ["limit", 10],
      ["offset", 20],
    ]);
  });
});

describe("parseIntParam", () => {
  it("returns the fallback for a missing value", () => {
    expect(parseIntParam(undefined, 25)).toBe(25);
  });

  it("returns the fallback for a non-numeric string", () => {
    expect(parseIntParam("abc", 25)).toBe(25);
  });

  it("returns the fallback for zero and negatives", () => {
    expect(parseIntParam("0", 25)).toBe(25);
    expect(parseIntParam("-5", 25)).toBe(25);
  });

  it("parses a numeric string", () => {
    expect(parseIntParam("42", 25)).toBe(42);
  });

  it("floors a fractional value", () => {
    expect(parseIntParam("42.9", 25)).toBe(42);
  });

  it("clamps to max when provided", () => {
    expect(parseIntParam("500", 25, 100)).toBe(100);
  });

  it("does not raise a value below max", () => {
    expect(parseIntParam("10", 25, 100)).toBe(10);
  });

  it("returns the fallback for Infinity", () => {
    expect(parseIntParam(Number.POSITIVE_INFINITY, 25, 100)).toBe(25);
  });
});
