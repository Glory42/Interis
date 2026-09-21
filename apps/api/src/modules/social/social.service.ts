import { SocialFeedService } from "./services/social-feed.service";
import { SocialFollowService } from "./services/social-follow.service";
import { SocialRepository, type ActivityType } from "./repositories/social.repository";
import { NotificationsService } from "../notifications/notifications.service";
import type { FeedMediaType } from "./types/social-feed.types";

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
    return SocialFollowService.follow(followerId, followingId, targetUsername);
  }

  static async unfollow(followerId: string, followingId: string) {
    return SocialFollowService.unfollow(followerId, followingId);
  }

  static async getFollowers(userId: string) {
    return SocialFollowService.getFollowers(userId);
  }

  static async getFollowing(userId: string) {
    return SocialFollowService.getFollowing(userId);
  }

  static async isFollowing(followerId: string, followingId: string) {
    return SocialFollowService.isFollowing(followerId, followingId);
  }

  static async removeFollower(userId: string, followerUserId: string) {
    return SocialFollowService.removeFollower(userId, followerUserId);
  }

  static async getFeed(userId: string, cursor?: string, limit?: number) {
    return SocialFeedService.getFeed(userId, cursor, limit);
  }

  static async getFollowingFeed(
    userId: string,
    limit?: number,
    cursor?: string,
    mediaType?: FeedMediaType,
  ) {
    return SocialFeedService.getFollowingFeed(userId, limit, cursor, mediaType);
  }

  static async likeActivity(
    userId: string,
    activityId: string,
  ): Promise<{ error: string } | { success: true }> {
    const activity = await SocialRepository.findActivityById(activityId);
    if (!activity) {
      return { error: "Activity not found" } as const;
    }
    await Promise.all([
      SocialRepository.likeActivity(userId, activityId),
      NotificationsService.notify({
        recipientId: activity.userId,
        actorId: userId,
        type: "like_activity",
        entityId: activityId,
      }),
    ]);
    return { success: true } as const;
  }

  static async unlikeActivity(userId: string, activityId: string) {
    await SocialRepository.unlikeActivity(userId, activityId);
    return { success: true } as const;
  }

  static async listAllActivitiesForAdmin(
    filters: { userId?: string; type?: ActivityType },
    limit: number,
    offset: number,
  ) {
    return SocialRepository.listAllForAdmin(filters, limit, offset);
  }

  static async deleteActivityForAdmin(activityId: string) {
    return SocialRepository.deleteById(activityId);
  }
}
