export type TrendingMediaType = "movie" | "tv";

export type TrendingSignal = {
  userId: string;
  mediaType: TrendingMediaType;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
  createdAt: Date;
};

export type TrendingTitle = {
  mediaType: TrendingMediaType;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number | null;
  distinctUserCount: number;
};

export const rankTrendingTitles = (
  signals: TrendingSignal[],
  limit: number,
): TrendingTitle[] => {
  const userIdsByKey = new Map<string, Set<string>>();
  const latestSignalByKey = new Map<string, TrendingSignal>();

  for (const signal of signals) {
    const key = `${signal.mediaType}:${signal.tmdbId}`;

    const userIds = userIdsByKey.get(key) ?? new Set<string>();
    userIds.add(signal.userId);
    userIdsByKey.set(key, userIds);

    latestSignalByKey.set(key, signal);
  }

  const titles: TrendingTitle[] = [...latestSignalByKey.entries()].map(([key, signal]) => ({
    mediaType: signal.mediaType,
    tmdbId: signal.tmdbId,
    title: signal.title,
    posterPath: signal.posterPath,
    releaseYear: signal.releaseYear,
    distinctUserCount: userIdsByKey.get(key)!.size,
  }));

  return titles
    .sort((a, b) => b.distinctUserCount - a.distinctUserCount)
    .slice(0, limit);
};
