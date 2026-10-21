// True when any incoming TMDB-derived field differs from the cached row, so a stale
// cache refresh can skip the write (and its dead tuple) when TMDB data is unchanged.
export const hasCachedMediaChanged = (
  existing: Record<string, unknown>,
  incoming: Record<string, unknown>,
): boolean =>
  Object.entries(incoming).some(
    ([key, value]) => JSON.stringify(existing[key] ?? null) !== JSON.stringify(value ?? null),
  );
