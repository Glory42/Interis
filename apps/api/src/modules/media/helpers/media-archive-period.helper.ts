// Shared by the movies and serials archive services - both compute an
// identical date-window shape from an identical set of period values, and
// classify an item into that window the same way, differing only in which
// date field each media type carries (releaseDate vs firstAirDate) and how
// that field's timestamp is derived. Kept generic here so the two archive
// services can't drift out of sync on this logic; per-media-type tuning
// (confidence thresholds, vote-count floors) stays in each module.

export type ArchivePeriod = "all_time" | "this_year" | "last_10_years" | "this_week" | "today";

export type ArchivePeriodWindow = {
  dateGte: string | null;
  dateLte: string | null;
  startYear: number | null;
  endYear: number | null;
};

const toIsoDateUtc = (date: Date): string => {
  return date.toISOString().slice(0, 10);
};

export const computeArchivePeriodWindow = (period: ArchivePeriod): ArchivePeriodWindow => {
  if (period === "all_time") {
    return { dateGte: null, dateLte: null, startYear: null, endYear: null };
  }

  const now = new Date();
  const nowYear = now.getUTCFullYear();
  const todayIsoDate = toIsoDateUtc(now);

  if (period === "today") {
    return { dateGte: todayIsoDate, dateLte: todayIsoDate, startYear: nowYear, endYear: nowYear };
  }

  if (period === "this_week") {
    const daysSinceSunday = now.getUTCDay();
    const weekStartDate = new Date(
      Date.UTC(nowYear, now.getUTCMonth(), now.getUTCDate() - daysSinceSunday),
    );

    return {
      dateGte: toIsoDateUtc(weekStartDate),
      dateLte: todayIsoDate,
      startYear: weekStartDate.getUTCFullYear(),
      endYear: nowYear,
    };
  }

  if (period === "this_year") {
    return {
      dateGte: `${nowYear}-01-01`,
      dateLte: todayIsoDate,
      startYear: nowYear,
      endYear: nowYear,
    };
  }

  const startYear = nowYear - 9;

  return {
    dateGte: `${startYear}-01-01`,
    dateLte: todayIsoDate,
    startYear,
    endYear: nowYear,
  };
};

// `timestamp` must be pre-computed by the caller (e.g.
// `toReleaseTimestamp(movie.releaseDate, movie.releaseYear)`) using
// whatever exact arguments that media type's existing timestamp helper
// expects - kept as a plain number here (not a callback re-invoked with
// generic-provided arguments) so this function can't accidentally change
// what gets passed to it per media type.
export const isItemInArchivePeriod = (
  timestamp: number,
  itemYear: number | null,
  period: ArchivePeriod,
  window: ArchivePeriodWindow,
): boolean => {
  if (period === "all_time") {
    return true;
  }

  if (timestamp !== Number.NEGATIVE_INFINITY) {
    const startDateMs = window.dateGte ? Date.parse(window.dateGte) : Number.NEGATIVE_INFINITY;
    const endDateMs = window.dateLte ? Date.parse(window.dateLte) : Number.POSITIVE_INFINITY;

    return timestamp >= startDateMs && timestamp <= endDateMs;
  }

  if (itemYear === null) {
    return false;
  }

  if (period === "today" || period === "this_week") {
    return false;
  }

  const startYear = window.startYear ?? Number.NEGATIVE_INFINITY;
  const endYear = window.endYear ?? Number.POSITIVE_INFINITY;

  return itemYear >= startYear && itemYear <= endYear;
};

export const getGenericTmdbMinVoteCountForPeriod = <TSort extends string>(
  period: ArchivePeriod,
  sortBy: TSort,
  ratingSortKey: TSort,
  minVoteCountByPeriod: Record<ArchivePeriod, number>,
): number => {
  if (sortBy === ratingSortKey) {
    return minVoteCountByPeriod[period];
  }

  if (period === "this_week" || period === "today") {
    return 0;
  }

  return 15;
};
