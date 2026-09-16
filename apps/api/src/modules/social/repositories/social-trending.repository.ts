import { and, gte, inArray } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { activities } from "../social.entity";
import type { ActivityType } from "./social.repository";

// The activity types that count as genuine engagement with a title for
// trending purposes - deliberately excludes second-order engagement like
// liked_review/commented (engaging with someone else's take, not the movie
// itself) and created_list/post (weak or ambiguous signals). See
// docs/adr/0001-global-trending-on-interis.md.
export const TRENDING_ACTIVITY_TYPES: ActivityType[] = [
  "diary_entry",
  "review",
  "liked_movie",
  "watchlisted_movie",
  "watched_movie",
];

export class SocialTrendingRepository {
  static async getTrendingActivityRows(since: Date) {
    return db
      .select({
        userId: activities.userId,
        metadata: activities.metadata,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .where(
        and(inArray(activities.type, TRENDING_ACTIVITY_TYPES), gte(activities.createdAt, since)),
      );
  }
}
