import { isSuspensionInEffect } from "../../../commons/auth/suspension.helper";
import { createTtlCache } from "../../../infrastructure/cache/ttl-cache.helper";
import { WatchGoalsService } from "../../watch-goals/watch-goals.service";
import { YEAR_REVIEW_MIN_YEAR, currentYearReviewYear } from "../dto/year-review.dto";
import {
  busiestMonthOf,
  depthFor,
  fillMonths,
  roundedRatings,
  toMostLikedReview,
  totalsWithHours,
} from "../helpers/year-review-assemble.helper";
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

  return {
    year,
    isPartialYear: year === thisYear,
    depth: depthFor(current.logs),
    user,
    totals: current,
    previousYear:
      previous.logs > 0 ? { films: previous.films, series: previous.series, hoursWatched: previous.hoursWatched } : null,
    months,
    busiestMonth: busiestMonthOf(months),
    logsPerDay: calendar.days,
    longestStreak: calendar.streak,
    firstWatch: highlights.firstWatch,
    lastWatch: highlights.lastWatch,
    topGenres: taste.topGenres,
    topDirectors: taste.topDirectors,
    decades: taste.decades,
    topRated: highlights.topRated,
    mostRewatched: highlights.mostRewatched,
    ratings: roundedRatings(taste.averageRating, taste.ratedLogs, highlights.communityAverage),
    reviews: { count: social.reviews, mostLiked: toMostLikedReview(social.mostLikedReview) },
    listsCreated: social.lists,
    newFollowers: social.followers,
    goal,
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
