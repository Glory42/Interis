// Keeps the first item per key; infinite pages can repeat an item when the
// source shifts between requests, which would also repeat a React key.
export const dedupeBy = <T, K>(items: T[], keyOf: (item: T) => K): T[] => {
  const seen = new Set<K>();
  return items.filter((item) => {
    const key = keyOf(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
