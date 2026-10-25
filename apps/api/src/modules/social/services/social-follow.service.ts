import { SocialRepository } from "../repositories/social.repository";
import { ModerationRepository } from "../../moderation/repositories/moderation.repository";
import { NotificationsService } from "../../notifications/notifications.service";
import { ActivityRecorder } from "./activity-recorder.service";
import { SocialFeedService } from "./social-feed.service";

export class SocialFollowService {
  static async follow(
    followerId: string,
    followingId: string,
    targetUsername?: string,
  ): Promise<{ error: string } | { success: true }> {
    if (followerId === followingId) {
      return { error: "Cannot follow yourself" } as const;
    }

    if (await ModerationRepository.isBlocked(followerId, followingId)) {
      return { error: "Cannot follow this user" } as const;
    }

    const row = await SocialRepository.insertFollow(followerId, followingId);

    if (row) {
      await Promise.all([
        ActivityRecorder.record({
          userId: followerId,
          type: "followed_user",
          entityId: followingId,
          metadata: {
            followingId,
            targetUsername: targetUsername ?? null,
          },
        }),
        NotificationsService.notify({
          recipientId: followingId,
          actorId: followerId,
          type: "follow",
          entityId: followerId,
        }),
      ]);
    }

    return { success: true } as const;
  }

  static async unfollow(followerId: string, followingId: string) {
    await SocialRepository.deleteFollow(followerId, followingId);
    await SocialFollowService.retractFollow(followerId, followingId);
    return { success: true } as const;
  }

  static async getFollowers(userId: string) {
    return SocialRepository.getFollowers(userId);
  }

  static async getFollowing(userId: string) {
    return SocialRepository.getFollowing(userId);
  }

  static async isFollowing(followerId: string, followingId: string) {
    return SocialRepository.isFollowing(followerId, followingId);
  }

  static async removeFollower(userId: string, followerUserId: string) {
    await SocialRepository.removeFollower(userId, followerUserId);
    await SocialFollowService.retractFollow(followerUserId, userId);
    return { success: true } as const;
  }

  // The follow is gone either way (unfollowed, or removed by the person
  // followed), so its feed row and notification go too, and the follower's
  // cached feed must stop showing the account.
  private static async retractFollow(followerId: string, followingId: string) {
    SocialFeedService.invalidateFollowingFeed(followerId);
    await Promise.all([
      ActivityRecorder.retract({
        userId: followerId,
        type: "followed_user",
        entityId: followingId,
      }),
      NotificationsService.retract({ actorId: followerId, type: "follow", entityId: followerId }),
    ]);
  }
}
