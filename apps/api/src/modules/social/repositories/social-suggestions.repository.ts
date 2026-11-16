import { sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import {
  SUGGESTION_AGREEMENT_MAX_GAP,
  SUGGESTION_FALLBACK_POOL_SIZE,
  SUGGESTION_SEED_TITLES_PER_MEDIA,
} from "../constants/follow-suggestions.constants";

export type FollowSuggestionRow = {
  id: string;
  username: string;
  displayUsername: string | null;
  avatarUrl: string | null;
  sharedCount: number;
  agreeTitle: string | null;
  followerCount: number;
};

export class SocialSuggestionsRepository {
  // One query: overlap with the viewer's watched/rated titles scores first
  // (closer ratings weigh more), then the most followed and most active users.
  static async findForViewer(viewerId: string, limit: number): Promise<FollowSuggestionRow[]> {
    const result = await db.execute<FollowSuggestionRow>(sql`
      WITH mine AS (
        (SELECT 'movie' AS kind, mi.movie_id AS media_id, mi.rating
          FROM movie_interaction mi
          WHERE mi.user_id = ${viewerId} AND (mi.is_watched OR mi.rating IS NOT NULL)
          ORDER BY mi.updated_at DESC LIMIT ${SUGGESTION_SEED_TITLES_PER_MEDIA})
        UNION ALL
        (SELECT 'tv' AS kind, si.series_id AS media_id, si.rating
          FROM serial_interaction si
          WHERE si.user_id = ${viewerId} AND (si.watch_status = 'completed' OR si.rating IS NOT NULL)
          ORDER BY si.updated_at DESC LIMIT ${SUGGESTION_SEED_TITLES_PER_MEDIA})
      ),
      shared AS (
        SELECT o.user_id, m.rating AS my_rating, o.rating AS their_rating, f.title
          FROM mine m
          JOIN movie_interaction o ON m.kind = 'movie' AND o.movie_id = m.media_id
          JOIN movie f ON f.id = m.media_id
          WHERE o.user_id <> ${viewerId} AND (o.is_watched OR o.rating IS NOT NULL)
        UNION ALL
        SELECT o.user_id, m.rating, o.rating, s.title
          FROM mine m
          JOIN serial_interaction o ON m.kind = 'tv' AND o.series_id = m.media_id
          JOIN tv_series s ON s.id = m.media_id
          WHERE o.user_id <> ${viewerId} AND (o.watch_status = 'completed' OR o.rating IS NOT NULL)
      ),
      overlap AS (
        SELECT user_id,
          count(*)::int AS shared_count,
          sum(
            1
            + CASE WHEN my_rating IS NOT NULL AND their_rating IS NOT NULL
                THEN 2 * greatest(0, 1 - abs(my_rating - their_rating) / 4.0) ELSE 0 END
            + CASE WHEN my_rating IS NULL AND their_rating >= 7 THEN 0.5 ELSE 0 END
          ) AS score,
          (array_agg(title ORDER BY abs(my_rating - their_rating), their_rating DESC)
            FILTER (WHERE abs(my_rating - their_rating) <= ${SUGGESTION_AGREEMENT_MAX_GAP}))[1] AS agree_title
        FROM shared
        GROUP BY user_id
      ),
      most_followed AS (
        SELECT following_id AS user_id FROM follow
          WHERE following_id <> ${viewerId}
          GROUP BY following_id ORDER BY count(*) DESC LIMIT ${SUGGESTION_FALLBACK_POOL_SIZE}
      ),
      most_active AS (
        SELECT user_id, count(*)::int AS recent_activity FROM activity
          WHERE created_at > now() - interval '30 days' AND user_id <> ${viewerId}
          GROUP BY user_id ORDER BY count(*) DESC LIMIT ${SUGGESTION_FALLBACK_POOL_SIZE}
      ),
      candidates AS (
        SELECT pool.user_id,
          coalesce(max(o.score), 0) AS score,
          coalesce(max(o.shared_count), 0) AS shared_count,
          max(o.agree_title) AS agree_title,
          coalesce(max(a.recent_activity), 0) AS recent_activity
        FROM (
          SELECT user_id FROM overlap
          UNION SELECT user_id FROM most_followed
          UNION SELECT user_id FROM most_active
        ) pool
        LEFT JOIN overlap o ON o.user_id = pool.user_id
        LEFT JOIN most_active a ON a.user_id = pool.user_id
        GROUP BY pool.user_id
      )
      SELECT u.id,
        u.username,
        u.display_username AS "displayUsername",
        p.avatar_url AS "avatarUrl",
        c.shared_count AS "sharedCount",
        c.agree_title AS "agreeTitle",
        (SELECT count(*)::int FROM follow fl WHERE fl.following_id = u.id) AS "followerCount"
      FROM candidates c
      JOIN "user" u ON u.id = c.user_id
      JOIN profile p ON p.user_id = u.id
      WHERE NOT (p.is_suspended AND (p.suspended_until IS NULL OR p.suspended_until > now()))
        AND NOT EXISTS (SELECT 1 FROM follow f WHERE f.follower_id = ${viewerId} AND f.following_id = u.id)
        AND NOT EXISTS (
          SELECT 1 FROM user_block b
            WHERE (b.blocker_id = ${viewerId} AND b.blocked_id = u.id)
               OR (b.blocker_id = u.id AND b.blocked_id = ${viewerId})
        )
        AND NOT EXISTS (SELECT 1 FROM user_mute mu WHERE mu.muter_id = ${viewerId} AND mu.muted_id = u.id)
        AND (
          EXISTS (SELECT 1 FROM sessions s WHERE s.user_id = u.id AND s.updated_at > now() - interval '90 days')
          OR EXISTS (SELECT 1 FROM activity a WHERE a.user_id = u.id AND a.created_at > now() - interval '90 days')
        )
      ORDER BY c.score DESC, "followerCount" DESC, c.recent_activity DESC, u.id
      LIMIT ${limit}
    `);
    return result.rows;
  }
}
