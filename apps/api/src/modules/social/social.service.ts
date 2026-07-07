import { SocialFeedService } from "./services/social-feed.service";
import { SocialFollowService } from "./services/social-follow.service";
import { SocialRepository } from "./repositories/social.repository";

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

  static async getFollowingFeed(userId: string, limit?: number, cursor?: string) {
    return SocialFeedService.getFollowingFeed(userId, limit, cursor);
  }

  static async likeActivity(userId: string, activityId: string) {
    const activity = await SocialRepository.findActivityById(activityId);
    if (!activity) {
      return { error: "Activity not found" } as const;
    }
    await SocialRepository.likeActivity(userId, activityId);
    return { success: true } as const;
  }

  static async unlikeActivity(userId: string, activityId: string) {
    await SocialRepository.unlikeActivity(userId, activityId);
    return { success: true } as const;
  }
}
