import { eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { yearRange } from "./year-review-logs.repository";

type MostLikedReviewRow = {
  id: string;
  content: string;
  containsSpoilers: boolean;
  mediaType: string;
  tmdbId: number | null;
  mediaTitle: string | null;
  posterPath: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  likeCount: number;
};

// The n-th ":"-separated part of a review's media source id as an int, or null.
const sourceIdPart = (n: number) => sql.raw(`(CASE WHEN split_part(r.media_source_id, ':', ${n}) ~ '^[0-9]{1,9}$'
  THEN split_part(r.media_source_id, ':', ${n})::int END)`);

export class YearReviewSocialRepository {
  static async findOwner(username: string) {
    const [row] = await db
      .select({
        userId: user.id,
        username: user.username,
        displayUsername: user.displayUsername,
        avatarUrl: profiles.avatarUrl,
        isSuspended: profiles.isSuspended,
        suspendedUntil: profiles.suspendedUntil,
      })
      .from(user)
      .leftJoin(profiles, eq(profiles.userId, user.id))
      .where(eq(user.username, username))
      .limit(1);
    return row ?? null;
  }

  // Reviews written, the most-liked one, public Lists created and Follows gained in the year
  // (timestamps are UTC), plus every year with a Diary Entry.
  static async getSocial(userId: string, year: number) {
    const { start, end } = yearRange(year);
    const inYear = (column: string) =>
      sql`${sql.raw(column)} >= ${start}::timestamp AND ${sql.raw(column)} < ${end}::timestamp`;
    const result = await db.execute<{
      reviews: number;
      lists: number;
      followers: number;
      most_liked: MostLikedReviewRow | null;
      years: number[];
    }>(sql`
      SELECT
        (SELECT count(*)::int FROM review r WHERE r.user_id = ${userId} AND ${inYear("r.created_at")}) AS reviews,
        (SELECT count(*)::int FROM list l WHERE l.user_id = ${userId} AND l.is_public AND ${inYear("l.created_at")}) AS lists,
        (SELECT count(*)::int FROM follow f WHERE f.following_id = ${userId} AND ${inYear("f.created_at")}) AS followers,
        (SELECT row_to_json(top) FROM (
          SELECT r.id, r.content, r.contains_spoilers AS "containsSpoilers", r.media_type AS "mediaType",
            coalesce(m.tmdb_id, t.tmdb_id) AS "tmdbId", coalesce(m.title, t.title) AS "mediaTitle",
            coalesce(m.poster_path, t.poster_path) AS "posterPath",
            CASE WHEN r.media_type <> 'movie' THEN ${sourceIdPart(2)} END AS "seasonNumber",
            CASE WHEN r.media_type <> 'movie' THEN ${sourceIdPart(3)} END AS "episodeNumber",
            likes.count AS "likeCount"
          FROM review r
          JOIN (
            SELECT rl.review_id, count(*)::int AS count FROM review_like rl
            WHERE rl.review_id IN (SELECT r.id FROM review r WHERE r.user_id = ${userId} AND ${inYear("r.created_at")})
            GROUP BY rl.review_id
          ) likes ON likes.review_id = r.id
          LEFT JOIN movie m ON m.id = r.movie_id
          LEFT JOIN tv_series t ON r.media_type <> 'movie' AND t.tmdb_id = ${sourceIdPart(1)}
          ORDER BY likes.count DESC, r.created_at DESC LIMIT 1
        ) top) AS most_liked,
        (SELECT coalesce(json_agg(y.year ORDER BY y.year DESC), '[]'::json) FROM (
          SELECT DISTINCT extract(year FROM watched_date)::int AS year FROM diary_entry WHERE user_id = ${userId}
          UNION
          SELECT DISTINCT extract(year FROM watched_date)::int FROM serial_diary_entry WHERE user_id = ${userId}
        ) y) AS years
    `);
    const row = result.rows[0];
    return {
      reviews: Number(row?.reviews ?? 0),
      lists: Number(row?.lists ?? 0),
      followers: Number(row?.followers ?? 0),
      mostLikedReview: row?.most_liked ?? null,
      years: (row?.years ?? []).map(Number),
    };
  }
}
