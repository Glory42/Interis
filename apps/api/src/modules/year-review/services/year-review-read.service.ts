import { isSuspensionInEffect } from "../../../commons/auth/suspension.helper";
import { createTtlCache } from "../../../infrastructure/cache/ttl-cache.helper";
import { WatchGoalsService } from "../../watch-goals/watch-goals.service";
import { YEAR_REVIEW_MIN_YEAR, currentYearReviewYear } from "../dto/year-review.dto";
import {
  busiestDayOf,
  busiestMonthOf,
  depthFor,
  fillMonths,
  pre1980ShareOf,
  roundedRatings,
  toMostLikedReview,
  toSpotlightReview,
  totalsWithHours,
  viewingAgeOf,
} from "../helpers/year-review-assemble.helper";
import { resolvePersona } from "../helpers/year-review-persona.helper";
import { YearReviewLogsRepository } from "../repositories/year-review-logs.repository";
import { YearReviewSocialRepository } from "../repositories/year-review-social.repository";
import type { YearReview, YearReviewOwner } from "../types/year-review.types";

const OWNER_TTL_MS = 10 * 60 * 1000;
const CURRENT_YEAR_TTL_MS = 10 * 60 * 1000;
// A past year only changes when someone backdates a log or edits an old one.
const PAST_YEAR_TTL_MS = 6 * 60 * 60 * 1000;

// Null for an unknown user or one whose Suspension is in effect.
const findOwner = async (username: string): Promise<YearReviewOwner | null> => {
  const row = await YearReviewSocialRepository.findOwner(username);
  if (!row || isSuspensionInEffect({ isSuspended: row.isSuspended ?? false, suspendedUntil: row.suspendedUntil ?? null })) {
    return null;
  }
  return {
    userId: row.userId,
    username: row.username,
    displayName: row.displayUsername ?? row.username,
    avatarUrl: row.avatarUrl ?? null,
  };
};

// A fixed set of aggregate queries, run together; nothing is loaded row by row.
const loadYear = async (owner: YearReviewOwner, year: number): Promise<YearReview> => {
  const [totals, calendar, highlights, taste, social, goal] = await Promise.all([
    YearReviewLogsRepository.getTotals(owner.userId, year),
    YearReviewLogsRepository.getCalendar(owner.userId, year),
    YearReviewLogsRepository.getHighlights(owner.userId, year),
    YearReviewLogsRepository.getTaste(owner.userId, year),
    YearReviewSocialRepository.getSocial(owner.userId, year),
    WatchGoalsService.getYearResult(owner.userId, year),
  ]);

  const current = totalsWithHours(totals.current);
  const previous = totalsWithHours(totals.previous);
  const months = fillMonths(calendar.months);
  const thisYear = currentYearReviewYear();
  const { userId: _userId, ...user } = owner;

  const depth = depthFor(current.logs);
  const topDirectors = taste.topDirectors.map((director) => ({
    director: director.director,
    count: director.count,
    slug: director.slug,
  }));
  const directorTitles =
    taste.topDirectors[0] && taste.topDirectors[0].count >= 2 ? taste.topDirectors[0].titles : [];
  const ratings = roundedRatings(taste.averageRating, taste.ratedLogs, highlights.communityAverage);
  const busiestDay = busiestDayOf(calendar.days);
  const viewingAge = viewingAgeOf(taste.releaseYearMedian);
  const pre1980Share = pre1980ShareOf(taste.decades);
  const topFilm = highlights.topFilms[0]
    ? { ...highlights.topFilms[0], review: toSpotlightReview(highlights.topFilmReview) }
    : null;
  const topSeriesSpotlight = highlights.topSeries[0]
    ? { ...highlights.topSeries[0], review: null }
    : null;

  const persona = resolvePersona({
    depth,
    logs: current.logs,
    filmLogs: current.filmLogs,
    seriesLogs: current.seriesLogs,
    films: current.films,
    series: current.series,
    episodes: current.episodes,
    hoursWatched: current.hoursWatched,
    rewatchLogs: current.rewatchLogs,
    mostRewatchedLogCount: highlights.mostRewatched?.logCount ?? 0,
    averageRating: ratings.average,
    communityAverage: ratings.communityAverage,
    ratedLogs: ratings.ratedLogs,
    highRatings: highlights.highRatings,
    topGenres: taste.topGenres,
    topDirectors,
    decades: taste.decades,
    reviewCount: social.reviews,
    listsCreated: social.lists,
    longestStreakDays: calendar.streak?.days ?? 0,
    busiestDayCount: busiestDay?.count ?? 0,
    viewingAge,
    pre1980Share,
    distinctGenres: taste.distinctGenres,
    distinctDirectors: taste.distinctDirectors,
  });

  return {
    year,
    isPartialYear: year === thisYear,
    depth,
    user,
    totals: current,
    previousYear:
      previous.logs > 0 ? { films: previous.films, series: previous.series, hoursWatched: previous.hoursWatched } : null,
    months,
    busiestMonth: busiestMonthOf(months),
    busiestDay,
    logsPerDay: calendar.days,
    longestStreak: calendar.streak,
    firstWatch: highlights.firstWatch,
    lastWatch: highlights.lastWatch,
    topGenres: taste.topGenres,
    distinctGenres: taste.distinctGenres,
    topDirectors,
    directorTitles,
    distinctDirectors: taste.distinctDirectors,
    decades: taste.decades,
    viewingAge,
    pre1980Share,
    topRated: highlights.topRated,
    topFilms: highlights.topFilms,
    topSeries: highlights.topSeries,
    topFilm,
    topSeriesSpotlight,
    mostRewatched: highlights.mostRewatched,
    ratings,
    highRatings: highlights.highRatings,
    reviews: { count: social.reviews, mostLiked: toMostLikedReview(social.mostLikedReview) },
    listsCreated: social.lists,
    newFollowers: social.followers,
    goal,
    persona,
    posterPaths: highlights.posterPaths,
    availableYears: social.years.filter((available) => available >= YEAR_REVIEW_MIN_YEAR && available <= thisYear),
  };
};

const yearKey = (owner: YearReviewOwner, year: number) => `${owner.userId}:${year}`;
const ownerCache = createTtlCache(findOwner, { ttlMs: OWNER_TTL_MS, maxEntries: 500 });
const currentYearCache = createTtlCache(loadYear, { keyFn: yearKey, ttlMs: CURRENT_YEAR_TTL_MS, maxEntries: 200 });
const pastYearCache = createTtlCache(loadYear, { keyFn: yearKey, ttlMs: PAST_YEAR_TTL_MS, maxEntries: 300 });

// Viewer-independent, so cached in-process per user and year; never writes.
export class YearReviewReadService {
  static async read(username: string, year: number): Promise<YearReview | null> {
    const owner = await ownerCache(username);
    if (!owner) return null;
    return year === currentYearReviewYear() ? currentYearCache(owner, year) : pastYearCache(owner, year);
  }
}
