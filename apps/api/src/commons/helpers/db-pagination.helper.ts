type LimitOffsetChain<TQuery> = {
  limit(count: number): TQuery;
  offset(count: number): TQuery;
};

/**
 * Applies `.limit()`/`.offset()` to a `.$dynamic()` Drizzle query only when
 * provided, independently of each other - so passing `offset` without
 * `limit` still takes effect instead of silently being dropped.
 */
export const applyOptionalPagination = <TQuery extends LimitOffsetChain<TQuery>>(
  query: TQuery,
  limit?: number,
  offset?: number,
): TQuery => {
  let result = query;

  if (limit !== undefined) {
    result = result.limit(limit);
  }

  if (offset !== undefined) {
    result = result.offset(offset);
  }

  return result;
};
