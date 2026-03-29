import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { activities, follows } from "./social.entity";
import { user } from "../../infrastructure/database/auth.entity";
import { profiles } from "../users/users.entity";
import { normalizeLimit } from "./helpers/social-feed-metadata.helper";
import { buildPostEngagementContext, buildReviewContext } from "./helpers/social-feed-context.helper";
import { toFeedItem } from "./helpers/social-feed-item.helper";
import type {
  FeedItem,
} from "./types/social-feed.types";

export type {
  FeedActivityKind,
  FeedMovie,
  FeedPostMediaType,
  FeedPost,
  FeedReview,
  FeedMetadata,
  FeedEngagement,
  FeedItem,
} from "./dto/social-feed.dto";

export class SocialService {
  static async follow(
    followerId: string,
    followingId: string,
    targetUsername?: string,
  ) {
    if (followerId === followingId) {
      return { error: "Cannot follow yourself" } as const;
    }

    const [row] = await db
      .insert(follows)
      .values({ followerId, followingId })
      .onConflictDoNothing()
      .returning();

    if (row) {
      await db.insert(activities).values({
        userId: followerId,
        type: "followed_user",
        entityId: followingId,
        metadata: JSON.stringify({
          followingId,
          targetUsername: targetUsername ?? null,
        }),
      });
    }

    return { success: true } as const;
  }

  static async unfollow(followerId: string, followingId: string) {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
    return { success: true } as const;
  }

  static async getFollowers(userId: string) {
    return db
      .select({
        id: user.id,
        username: user.username,
        displayUsername: user.displayUsername,
        image: user.image,
        avatarUrl: profiles.avatarUrl,
      })
      .from(follows)
      .innerJoin(user, eq(follows.followerId, user.id))
      .leftJoin(profiles, eq(user.id, profiles.userId))
      .where(eq(follows.followingId, userId));
  }

  static async getFollowing(userId: string) {
    return db
      .select({
        id: user.id,
        username: user.username,
        displayUsername: user.displayUsername,
        image: user.image,
        avatarUrl: profiles.avatarUrl,
      })
      .from(follows)
      .innerJoin(user, eq(follows.followingId, user.id))
      .leftJoin(profiles, eq(user.id, profiles.userId))
      .where(eq(follows.followerId, userId));
  }

  static async isFollowing(followerId: string, followingId: string) {
    const [row] = await db
      .select({ followerId: follows.followerId })
      .from(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
      .limit(1);

    return !!row;
  }

  static async getFeed(userId: string, _cursor?: string, limit?: number) {
    return SocialService.getFollowingFeed(userId, limit);
  }

  static async getFollowingFeed(userId: string, limit?: number): Promise<FeedItem[]> {
    const normalizedLimit = normalizeLimit(limit);

    const followingRows = await db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, userId));

    const feedUserIds = [...new Set([userId, ...followingRows.map((row) => row.followingId)])];

    const rows = await db
      .select({
        activity: activities,
        actorId: user.id,
        actorUsername: user.username,
        actorDisplayUsername: user.displayUsername,
        actorImage: user.image,
        actorAvatarUrl: profiles.avatarUrl,
      })
      .from(activities)
      .innerJoin(user, eq(activities.userId, user.id))
      .leftJoin(profiles, eq(activities.userId, profiles.userId))
      .where(inArray(activities.userId, feedUserIds))
      .orderBy(desc(activities.createdAt))
      .limit(normalizedLimit);

    const [reviewContext, postEngagementByPostId] = await Promise.all([
      buildReviewContext(rows, userId),
      buildPostEngagementContext(rows),
    ]);

    return Promise.all(rows.map((row) => toFeedItem(row, reviewContext, postEngagementByPostId)));
  }
}
