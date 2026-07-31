/**
 * Merges already-capped result sets fetched from separate sources (e.g. one
 * query per media type - pass their rows pre-combined, e.g. `[...movieRows,
 * ...serialRows]`, so TS can infer the row union correctly), sorts by
 * `sortKey` descending, then slices the exact page. Callers are expected to
 * have already limited each source query to `limit + offset` (or left it
 * unbounded) so this never pulls a whole collection just to paginate it.
 */
export const mergeSortedPaginated = <T>(
  rows: T[],
  limit: number | undefined,
  offset: number | undefined,
  sortKey: (row: T) => number,
): T[] => {
  const merged = [...rows].sort((left, right) => sortKey(right) - sortKey(left));

  return limit ? merged.slice(offset ?? 0, (offset ?? 0) + limit) : merged;
};
