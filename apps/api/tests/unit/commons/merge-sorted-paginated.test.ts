import { describe, expect, it } from "bun:test";
import { mergeSortedPaginated } from "../../../src/commons/helpers/merge-sorted-paginated.helper";

type Row = { id: string; sort: number };

const rows = (...sortKeys: number[]): Row[] =>
  sortKeys.map((sort, index) => ({ id: `r${index}`, sort }));

describe("mergeSortedPaginated", () => {
  it("sorts the combined rows by sortKey descending", () => {
    const merged = mergeSortedPaginated(rows(1, 5, 3), undefined, undefined, (r) => r.sort);
    expect(merged.map((r) => r.sort)).toEqual([5, 3, 1]);
  });

  it("does not mutate the input array", () => {
    const input = rows(1, 5, 3);
    mergeSortedPaginated(input, undefined, undefined, (r) => r.sort);
    expect(input.map((r) => r.sort)).toEqual([1, 5, 3]);
  });

  it("returns every row sorted when no limit is given", () => {
    const merged = mergeSortedPaginated(rows(2, 4), undefined, 1, (r) => r.sort);
    expect(merged.map((r) => r.sort)).toEqual([4, 2]);
  });

  it("slices exactly `limit` rows from the front when offset is omitted", () => {
    const merged = mergeSortedPaginated(rows(1, 2, 3, 4, 5), 2, undefined, (r) => r.sort);
    expect(merged.map((r) => r.sort)).toEqual([5, 4]);
  });

  it("applies offset then limit against the sorted order", () => {
    const merged = mergeSortedPaginated(rows(1, 2, 3, 4, 5), 2, 2, (r) => r.sort);
    expect(merged.map((r) => r.sort)).toEqual([3, 2]);
  });

  it("returns a short final page when offset + limit runs past the end", () => {
    const merged = mergeSortedPaginated(rows(1, 2, 3), 5, 2, (r) => r.sort);
    expect(merged.map((r) => r.sort)).toEqual([1]);
  });

  it("returns an empty page when offset is past the end", () => {
    const merged = mergeSortedPaginated(rows(1, 2, 3), 5, 10, (r) => r.sort);
    expect(merged).toEqual([]);
  });

  it("handles an empty input", () => {
    expect(mergeSortedPaginated<Row>([], 10, 0, (r) => r.sort)).toEqual([]);
  });
});
