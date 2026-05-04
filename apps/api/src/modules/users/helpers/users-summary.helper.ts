export type RecentPosterRow = {
  tmdbId: number;
  title: string;
  posterPath: string | null;
};

export const dedupeRecentPosters = (
  rows: RecentPosterRow[],
  limit = 5,
): RecentPosterRow[] => {
  const deduped: RecentPosterRow[] = [];
  const seenTmdbIds = new Set<number>();

  for (const row of rows) {
    if (seenTmdbIds.has(row.tmdbId)) {
      continue;
    }

    seenTmdbIds.add(row.tmdbId);
    deduped.push(row);

    if (deduped.length >= limit) {
      break;
    }
  }

  return deduped;
};
