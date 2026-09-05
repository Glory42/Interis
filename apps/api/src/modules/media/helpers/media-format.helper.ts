// Movies and serials both sort/feature/genre-normalize their archive items
// against a single release-date-or-year field - only the field names differ
// (releaseDate/releaseYear vs firstAirDate/firstAirYear). This is the shared
// implementation both movies-format.helper.ts and serials-format.helper.ts
// delegate to, so a fix to date parsing, tie-breaking, or genre shape
// validation lands once instead of needing to be ported by hand between them.

export const toMediaTimestamp = (
  date: string | null,
  year: number | null,
): number => {
  if (date) {
    const parsed = Date.parse(date);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  if (year !== null && Number.isFinite(year)) {
    return Date.UTC(year, 0, 1);
  }

  return Number.NEGATIVE_INFINITY;
};

// Ascending comparator: items missing a resolvable date always sort last,
// then by timestamp, then alphabetically by title as a stable tie-break.
export const compareMediaTimestampsAsc = (
  leftTimestamp: number,
  rightTimestamp: number,
  leftTitle: string,
  rightTitle: string,
): number => {
  const leftMissing = leftTimestamp === Number.NEGATIVE_INFINITY;
  const rightMissing = rightTimestamp === Number.NEGATIVE_INFINITY;

  if (leftMissing && !rightMissing) {
    return 1;
  }

  if (!leftMissing && rightMissing) {
    return -1;
  }

  if (leftTimestamp !== rightTimestamp) {
    return leftTimestamp - rightTimestamp;
  }

  return leftTitle.localeCompare(rightTitle);
};

export type RawGenreLike = { id: number; name: string };

export const normalizeGenres = <TGenre extends RawGenreLike>(
  rawGenres: unknown,
): TGenre[] => {
  if (!Array.isArray(rawGenres)) {
    return [];
  }

  return rawGenres
    .map((genre) => {
      if (!genre || typeof genre !== "object") {
        return null;
      }

      const maybeId = (genre as { id?: unknown }).id;
      const maybeName = (genre as { name?: unknown }).name;

      if (typeof maybeId !== "number" || typeof maybeName !== "string") {
        return null;
      }

      return { id: maybeId, name: maybeName } as TGenre;
    })
    .filter((genre): genre is TGenre => genre !== null);
};
