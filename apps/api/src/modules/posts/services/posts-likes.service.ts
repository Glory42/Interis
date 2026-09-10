import { ActivityRecorder } from "../../social/services/activity-recorder.service";
import { SocialFeedService } from "../../social/services/social-feed.service";
import { buildPostLikedActivityMetadata } from "../helpers/posts-activity.helper";
import { PostsRepository } from "../repositories/posts.repository";
import { NotificationsService } from "../../notifications/notifications.service";

export class PostsLikesService {
  static async like(userId: string, postId: string) {
    const row = await PostsRepository.insertLike(userId, postId);

    if (row) {
      const postMetadata = await PostsRepository.getPostFeedMetadata(postId);

      if (postMetadata) {
        await Promise.all([
          ActivityRecorder.record({
            userId,
            type: "commented",
            entityId: postId,
            metadata: buildPostLikedActivityMetadata({ post: postMetadata }),
          }),
          NotificationsService.notify({
            recipientId: postMetadata.userId,
            actorId: userId,
            type: "like_post",
            entityId: postId,
          }),
        ]);
      }
    }

    return { liked: true, wasNew: !!row };
  }

  static async unlike(userId: string, postId: string) {
    const result = await PostsRepository.deleteLikeByUserAndPost(userId, postId);
    SocialFeedService.invalidateFollowingFeed(userId);
    return result;
  }

  static async isLiked(userId: string, postId: string) {
    return PostsRepository.isLikedByUser(userId, postId);
  }
}
