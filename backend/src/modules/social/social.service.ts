import { SocialFeedService } from "./services/social-feed.service";
import { SocialFollowService } from "./services/social-follow.service";

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

  static async getFeed(userId: string, cursor?: string, limit?: number) {
    return SocialFeedService.getFeed(userId, cursor, limit);
  }

  static async getFollowingFeed(userId: string, limit?: number) {
    return SocialFeedService.getFollowingFeed(userId, limit);
  }
}
