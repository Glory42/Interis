import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { user } from "../../infrastructure/database/auth.entity";
import { profiles } from "../users/users.entity";
import { diaryEntries } from "../diary/diary.entity";
import { movies } from "../movies/movies.entity";
import { movieInteractions } from "../interactions/interactions.entity";
import { activities } from "../social/social.entity";
import { getMovieDirector } from "../../infrastructure/tmdb/cinemas";
import {
  DAY_IN_MS,
  contributionActivityTypes,
} from "./constants/public-contributions.constants";
import {
  applyContributionMediaTypes,
  createEmptyContributionDay,
  emptyMediaCounts,
  resolveContributionMediaTypes,
  toUtcDateKey,
} from "./helpers/public-contributions.helper";
import type {
  ContributionMediaType,
  PublicContributionDay,
  PublicContributionsResponse,
} from "./types/public-contributions.types";

// Thin, read-only service for the public portfolio API
// All responses are cached-friendly — no auth required

export class PublicService {
  private static async findUserIdByUsername(username: string): Promise<string | null> {
    const [profile] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, username))
      .limit(1);

    return profile?.id ?? null;
  }

  static async getRecentActivity(username: string, limit = 10) {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) return null;

    return db
      .select({
        watchedDate: diaryEntries.watchedDate,
        rating: diaryEntries.rating,
        rewatch: diaryEntries.rewatch,
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
      })
      .from(diaryEntries)
      .innerJoin(movies, eq(diaryEntries.movieId, movies.id))
      .where(eq(diaryEntries.userId, userId))
      .orderBy(desc(diaryEntries.watchedDate))
      .limit(limit);
  }

  static async getTop4(username: string) {
    const [profileRow] = await db
      .select({ top4MovieIds: profiles.top4MovieIds })
      .from(profiles)
      .innerJoin(user, eq(profiles.userId, user.id))
      .where(eq(user.username, username))
      .limit(1);

    if (!profileRow || !profileRow.top4MovieIds?.length) return null;

    // Fetch all saved movies in one query, then restore profile order
    const fetchedRows = await db
      .select({
        id: movies.id,
        tmdbId: movies.tmdbId,
        title: movies.title,
        posterPath: movies.posterPath,
        releaseYear: movies.releaseYear,
      })
      .from(movies)
      .where(inArray(movies.id, profileRow.top4MovieIds));

    const byId = new Map(fetchedRows.map((row) => [row.id, row]));
    const rows = profileRow.top4MovieIds.map((movieId) => byId.get(movieId) ?? null);

    const rowsWithDirector = await Promise.all(
      rows.map(async (row) => {
        if (!row) {
          return null;
        }

        try {
          const director = await getMovieDirector(row.tmdbId);
          return {
            ...row,
            director,
          };
        } catch {
          return {
            ...row,
            director: null,
          };
        }
      }),
    );

    return rowsWithDirector.filter(Boolean);
  }

  static async getContributions(
    username: string,
    windowDays?: number,
  ): Promise<PublicContributionsResponse | null> {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) {
      return null;
    }

    const now = new Date();
    const endDayTimestamp = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );
    const startDayTimestamp =
      typeof windowDays === "number"
        ? endDayTimestamp - (windowDays - 1) * DAY_IN_MS
        : Date.UTC(now.getUTCFullYear(), 0, 1);
    const resolvedWindowDays =
      Math.floor((endDayTimestamp - startDayTimestamp) / DAY_IN_MS) + 1;

    const startBoundary = new Date(startDayTimestamp);
    const endExclusiveBoundary = new Date(endDayTimestamp + DAY_IN_MS);

    const rows = await db
      .select({
        type: activities.type,
        metadata: activities.metadata,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .where(
        and(
          eq(activities.userId, userId),
          inArray(activities.type, [...contributionActivityTypes]),
          gte(activities.createdAt, startBoundary),
          lt(activities.createdAt, endExclusiveBoundary),
        ),
      )
      .orderBy(activities.createdAt);

    const byDate = new Map<string, PublicContributionDay>();

    for (const row of rows) {
      const dateKey = toUtcDateKey(row.createdAt);
      const current = byDate.get(dateKey) ?? createEmptyContributionDay(dateKey);

      current.totalCount += 1;
      if (row.type === "diary_entry") {
        current.logCount += 1;
      }
      if (row.type === "review") {
        current.reviewCount += 1;
      }

      const mediaTypes = resolveContributionMediaTypes(row.type, row.metadata);
      applyContributionMediaTypes(current, mediaTypes);

      byDate.set(dateKey, current);
    }

    const days: PublicContributionDay[] = [];
    for (
      let cursor = startDayTimestamp;
      cursor <= endDayTimestamp;
      cursor += DAY_IN_MS
    ) {
      const dateKey = toUtcDateKey(new Date(cursor));
      const existing = byDate.get(dateKey);
      days.push(existing ?? createEmptyContributionDay(dateKey));
    }

    const totals = days.reduce(
      (acc, day) => {
        acc.contributions += day.totalCount;
        acc.logs += day.logCount;
        acc.reviews += day.reviewCount;

        if (day.totalCount > 0) {
          acc.activeDays += 1;
        }

        for (const mediaType of Object.keys(day.mediaCounts) as ContributionMediaType[]) {
          acc.mediaCounts[mediaType] += day.mediaCounts[mediaType];
        }

        return acc;
      },
      {
        contributions: 0,
        activeDays: 0,
        logs: 0,
        reviews: 0,
        mediaCounts: emptyMediaCounts(),
      },
    );

    return {
      window: {
        startDate: toUtcDateKey(new Date(startDayTimestamp)),
        endDate: toUtcDateKey(new Date(endDayTimestamp)),
        days: resolvedWindowDays,
        weekStartsOn: "sunday",
        timezone: "UTC",
      },
      totals,
      days,
    };
  }

  static async getStats(username: string) {
    const userId = await PublicService.findUserIdByUsername(username);
    if (!userId) return null;

    const [diaryRows, likedRows] = await Promise.all([
      db
        .select({
          rating: diaryEntries.rating,
          rewatch: diaryEntries.rewatch,
        })
        .from(diaryEntries)
        .where(eq(diaryEntries.userId, userId)),
      db
        .select({ movieId: movieInteractions.movieId })
        .from(movieInteractions)
        .where(eq(movieInteractions.userId, userId)),
    ]);

    const watched = diaryRows.length;
    const rewatches = diaryRows.filter((r) => r.rewatch).length;
    const rated = diaryRows.filter((r) => r.rating !== null).length;
    const liked = likedRows.length;

    const avgRating =
      rated > 0
        ? diaryRows.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated / 2
        : null; // divide by 2 to convert 1-10 → 0.5-5.0

    return { watched, rewatches, rated, liked, avgRating };
  }
}
