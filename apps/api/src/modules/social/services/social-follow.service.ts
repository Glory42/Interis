import { SocialRepository } from "../repositories/social.repository";
import { ModerationRepository } from "../../moderation/repositories/moderation.repository";
import { NotificationsService } from "../../notifications/notifications.service";

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
        SocialRepository.insertActivity({
          userId: followerId,
          type: "followed_user",
          entityId: followingId,
          metadata: JSON.stringify({
            followingId,
            targetUsername: targetUsername ?? null,
          }),
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
    return { success: true } as const;
  }
}
