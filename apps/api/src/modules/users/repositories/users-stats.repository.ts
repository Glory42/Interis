import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { diaryEntries } from "../../diary/diary.entity";
import { lists } from "../../lists/lists.entity";
import { movies } from "../../movies/movies.entity";
import { reviews } from "../../reviews/reviews.entity";
import { serialDiaryEntries } from "../../serials/serials.entity";
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
      serialEntryRows,
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
        .from(serialDiaryEntries)
        .where(eq(serialDiaryEntries.userId, userId)),
      db
        .select({ count: sql<number>`count(*)`.mapWith(Number) })
        .from(reviews)
        .where(eq(reviews.userId, userId)),
      db
        .select({
          count: sql<number>`(
            SELECT count(distinct id) FROM (
              SELECT movie_id AS id FROM diary_entry WHERE user_id = ${userId}
              UNION
              SELECT movie_id AS id FROM movie_interaction WHERE user_id = ${userId} AND is_watched = true
            ) unique_films
          )`.mapWith(Number),
        })
        .from(diaryEntries) // Keep dummy from/where so structure is clean
        .limit(1),
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
      filmEntryCount: entryRows[0]?.count ?? 0,
      serialEntryCount: serialEntryRows[0]?.count ?? 0,
      reviewCount: reviewRows[0]?.count ?? 0,
      filmCount: filmRows[0]?.count ?? 0,
      listCount: listRows[0]?.count ?? 0,
      followerCount: followerRows[0]?.count ?? 0,
      followingCount: followingRows[0]?.count ?? 0,
    };
  }

  static async getDetailedStats(userId: string) {
    const [entriesPerMonthRows, ratingDistributionRows, topGenreRows, topDirectorRows] =
      await Promise.all([
        db.execute<{ month: string; count: number }>(sql`
          SELECT to_char(watched_date, 'YYYY-MM') AS month, count(*)::int AS count
          FROM (
            SELECT watched_date FROM diary_entry WHERE user_id = ${userId}
            UNION ALL
            SELECT watched_date FROM serial_diary_entry WHERE user_id = ${userId}
          ) combined
          WHERE watched_date >= (current_date - interval '12 months')
          GROUP BY to_char(watched_date, 'YYYY-MM')
          ORDER BY to_char(watched_date, 'YYYY-MM')
        `),
        db.execute<{ rating: number; count: number }>(sql`
          SELECT rating, count(*)::int AS count
          FROM (
            SELECT rating FROM diary_entry WHERE user_id = ${userId} AND rating IS NOT NULL
            UNION ALL
            SELECT rating FROM serial_diary_entry WHERE user_id = ${userId} AND rating IS NOT NULL
          ) combined
          GROUP BY rating
          ORDER BY rating
        `),
        db.execute<{ genre: string; count: number }>(sql`
          SELECT genre_element ->> 'name' AS genre, count(*)::int AS count
          FROM (
            SELECT m.genres AS genres
            FROM diary_entry d
            JOIN movie m ON m.id = d.movie_id
            WHERE d.user_id = ${userId} AND m.genres IS NOT NULL
            UNION ALL
            SELECT s.genres AS genres
            FROM serial_diary_entry sd
            JOIN tv_series s ON s.id = sd.series_id
            WHERE sd.user_id = ${userId} AND s.genres IS NOT NULL
          ) combined, jsonb_array_elements(combined.genres) AS genre_element
          GROUP BY genre_element ->> 'name'
          ORDER BY count DESC
          LIMIT 8
        `),
        db.execute<{ director: string; count: number }>(sql`
          SELECT m.director AS director, count(*)::int AS count
          FROM diary_entry d
          JOIN movie m ON m.id = d.movie_id
          WHERE d.user_id = ${userId} AND m.director IS NOT NULL AND m.director != ''
          GROUP BY m.director
          ORDER BY count DESC
          LIMIT 8
        `),
      ]);

    return {
      entriesPerMonth: entriesPerMonthRows.rows,
      ratingDistribution: ratingDistributionRows.rows,
      topGenres: topGenreRows.rows,
      topDirectors: topDirectorRows.rows,
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
