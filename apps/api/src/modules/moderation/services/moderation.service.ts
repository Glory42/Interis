import { UsersService } from "../../users/users.service";
import { SocialRepository } from "../../social/repositories/social.repository";
import { SocialFeedService } from "../../social/services/social-feed.service";
import { ModerationRepository } from "../repositories/moderation.repository";

type ServiceError = { error: string; status: 400 | 404 };

export class ModerationService {
  static async blockUser(
    blockerId: string,
    targetUsername: string,
  ): Promise<ServiceError | { success: true }> {
    const target = await UsersService.findByUsername(targetUsername);
    if (!target) {
      return { error: "User not found", status: 404 };
    }
    if (target.id === blockerId) {
      return { error: "Cannot block yourself", status: 400 };
    }

    await ModerationRepository.blockUser(blockerId, target.id);
    await Promise.all([
      SocialRepository.deleteFollow(blockerId, target.id),
      SocialRepository.deleteFollow(target.id, blockerId),
    ]);
    SocialFeedService.invalidateFollowingFeed(blockerId);
    SocialFeedService.invalidateFollowingFeed(target.id);

    return { success: true };
  }

  static async unblockUser(blockerId: string, targetUsername: string): Promise<void> {
    const target = await UsersService.findByUsername(targetUsername);
    if (!target) {
      return;
    }

    await ModerationRepository.unblockUser(blockerId, target.id);
    SocialFeedService.invalidateFollowingFeed(blockerId);
  }

  static async muteUser(
    muterId: string,
    targetUsername: string,
  ): Promise<ServiceError | { success: true }> {
    const target = await UsersService.findByUsername(targetUsername);
    if (!target) {
      return { error: "User not found", status: 404 };
    }
    if (target.id === muterId) {
      return { error: "Cannot mute yourself", status: 400 };
    }

    await ModerationRepository.muteUser(muterId, target.id);
    SocialFeedService.invalidateFollowingFeed(muterId);
    return { success: true };
  }

  static async unmuteUser(muterId: string, targetUsername: string): Promise<void> {
    const target = await UsersService.findByUsername(targetUsername);
    if (!target) {
      return;
    }

    await ModerationRepository.unmuteUser(muterId, target.id);
    SocialFeedService.invalidateFollowingFeed(muterId);
  }

  static async getRelationshipState(
    viewerId: string,
    targetUsername: string,
  ): Promise<ServiceError | { isBlocked: boolean; isMuted: boolean }> {
    const target = await UsersService.findByUsername(targetUsername);
    if (!target) {
      return { error: "User not found", status: 404 };
    }

    const [isBlocked, isMuted] = await Promise.all([
      ModerationRepository.isBlocked(viewerId, target.id),
      ModerationRepository.isMuted(viewerId, target.id),
    ]);

    return { isBlocked, isMuted };
  }

  static async listBlocked(userId: string) {
    return ModerationRepository.listBlocked(userId);
  }

  static async listMuted(userId: string) {
    return ModerationRepository.listMuted(userId);
  }
}
