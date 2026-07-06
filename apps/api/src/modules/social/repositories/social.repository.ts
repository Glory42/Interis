import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { activities, activityLikes, follows } from "../social.entity";

export class SocialRepository {
  static async insertFollow(followerId: string, followingId: string) {
    const [row] = await db
      .insert(follows)
      .values({ followerId, followingId })
      .onConflictDoNothing()
      .returning();

    return row ?? null;
  }

  static async insertActivity(input: {
    userId: string;
    type:
      | "diary_entry"
      | "review"
      | "liked_movie"
      | "watchlisted_movie"
      | "followed_user"
      | "created_list"
      | "liked_review"
      | "commented"
      | "post";
    entityId: string;
    metadata: string;
  }) {
    await db.insert(activities).values({
      userId: input.userId,
      type: input.type,
      entityId: input.entityId,
      metadata: input.metadata,
    });
  }

  static async deleteFollow(followerId: string, followingId: string) {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)));
  }

  static async removeFollower(userId: string, followerUserId: string) {
    await db
      .delete(follows)
      .where(and(eq(follows.followerId, followerUserId), eq(follows.followingId, userId)));
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

  static async getFollowingIdsByFollowerId(followerId: string) {
    return db
      .select({ followingId: follows.followingId })
      .from(follows)
      .where(eq(follows.followerId, followerId));
  }

  static async getFeedActivityRows(userIds: string[], limit: number) {
    return db
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
      .where(inArray(activities.userId, userIds))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  static async likeActivity(userId: string, activityId: string) {
    await db
      .insert(activityLikes)
      .values({ userId, activityId })
      .onConflictDoNothing();
  }

  static async unlikeActivity(userId: string, activityId: string) {
    await db
      .delete(activityLikes)
      .where(and(eq(activityLikes.userId, userId), eq(activityLikes.activityId, activityId)));
  }

  static async getActivityLikeCounts(activityIds: string[]) {
    if (activityIds.length === 0) return [];
    return db
      .select({
        activityId: activityLikes.activityId,
        count: sql<number>`count(*)::int`.as("count"),
      })
      .from(activityLikes)
      .where(inArray(activityLikes.activityId, activityIds))
      .groupBy(activityLikes.activityId);
  }

  static async getViewerActivityLikes(userId: string, activityIds: string[]) {
    if (activityIds.length === 0) return [];
    return db
      .select({ activityId: activityLikes.activityId })
      .from(activityLikes)
      .where(and(eq(activityLikes.userId, userId), inArray(activityLikes.activityId, activityIds)));
  }

  static async findActivityById(activityId: string) {
    const [row] = await db
      .select()
      .from(activities)
      .where(eq(activities.id, activityId))
      .limit(1);
    return row ?? null;
  }
}
