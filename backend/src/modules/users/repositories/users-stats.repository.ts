import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { diaryEntries } from "../../diary/diary.entity";
import { lists } from "../../lists/lists.entity";
import { movies } from "../../movies/movies.entity";
import { reviews } from "../../reviews/reviews.entity";
import { activities, follows } from "../../social/social.entity";

export class UsersStatsRepository {
  static async getTotalUsersCount(): Promise<number> {
    const rows = await db
      .select({ count: sql<number>`count(*)`.mapWith(Number) })
      .from(user);

    return rows[0]?.count ?? 0;
  }

  static async getNetworkStats(): Promise<{
    totalUsers: number;
    logsToday: number;
    liveReviews: number;
  }> {
    const [totalUsersRows, todayActivityRows] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(user),
      db
        .select({
          logsToday:
            sql<number>`count(*) filter (where ${activities.type} = 'diary_entry')`.mapWith(
              Number,
            ),
          liveReviews:
            sql<number>`count(*) filter (
              where ${activities.type} = 'review'
                or (
                  ${activities.type} = 'diary_entry'
                  and coalesce(((${activities.metadata})::jsonb ->> 'hasReview')::boolean, false)
                )
            )`.mapWith(Number),
        })
        .from(activities)
        .where(sql`${activities.createdAt}::date = current_date`),
    ]);

    return {
      totalUsers: totalUsersRows[0]?.count ?? 0,
      logsToday: todayActivityRows[0]?.logsToday ?? 0,
      liveReviews: todayActivityRows[0]?.liveReviews ?? 0,
    };
  }

  static async getStatsCounts(userId: string) {
    const [
      entryRows,
      reviewRows,
      filmRows,
      listRows,
      followerRows,
      followingRows,
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(diaryEntries)
        .where(eq(diaryEntries.userId, userId)),
      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(reviews)
        .where(eq(reviews.userId, userId)),
      db
        .select({ count: sql<number>`count(distinct ${diaryEntries.movieId})`.mapWith(Number) })
        .from(diaryEntries)
        .where(eq(diaryEntries.userId, userId)),
      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(lists)
        .where(and(eq(lists.userId, userId), eq(lists.isPublic, true))),
      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(follows)
        .where(eq(follows.followingId, userId)),
      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(follows)
        .where(eq(follows.followerId, userId)),
    ]);

    return {
      entryCount: entryRows[0]?.count ?? 0,
      reviewCount: reviewRows[0]?.count ?? 0,
      filmCount: filmRows[0]?.count ?? 0,
      listCount: listRows[0]?.count ?? 0,
      followerCount: followerRows[0]?.count ?? 0,
      followingCount: followingRows[0]?.count ?? 0,
    };
  }

  static async getMeSummaryData(userId: string) {
    const [logCountRows, followerCountRows, followingCountRows, recentRows] =
      await Promise.all([
        db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(diaryEntries)
          .where(eq(diaryEntries.userId, userId)),
        db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(follows)
          .where(eq(follows.followingId, userId)),
        db
          .select({ count: sql<number>`count(*)`.mapWith(Number) })
          .from(follows)
          .where(eq(follows.followerId, userId)),
        db
          .select({
            tmdbId: movies.tmdbId,
            title: movies.title,
            posterPath: movies.posterPath,
          })
          .from(diaryEntries)
          .innerJoin(movies, eq(diaryEntries.movieId, movies.id))
          .where(eq(diaryEntries.userId, userId))
          .orderBy(desc(diaryEntries.watchedDate), desc(diaryEntries.createdAt))
          .limit(20),
      ]);

    return {
      logs: logCountRows[0]?.count ?? 0,
      followers: followerCountRows[0]?.count ?? 0,
      following: followingCountRows[0]?.count ?? 0,
      recentRows,
    };
  }
}
