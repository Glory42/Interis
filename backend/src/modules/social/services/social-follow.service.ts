import { SocialRepository } from "../repositories/social.repository";

export class SocialFollowService {
  static async follow(
    followerId: string,
    followingId: string,
    targetUsername?: string,
  ) {
    if (followerId === followingId) {
      return { error: "Cannot follow yourself" } as const;
    }

    const row = await SocialRepository.insertFollow(followerId, followingId);

    if (row) {
      await SocialRepository.insertActivity({
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
}
