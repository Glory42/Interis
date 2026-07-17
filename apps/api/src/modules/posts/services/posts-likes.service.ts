import { db } from "../../../infrastructure/database/db";
import { activities } from "../../social/social.entity";
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
          db.insert(activities).values({
            userId,
            type: "commented",
            entityId: postId,
            metadata: JSON.stringify(
              buildPostLikedActivityMetadata({
                post: postMetadata,
              }),
            ),
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
    return PostsRepository.deleteLikeByUserAndPost(userId, postId);
  }

  static async isLiked(userId: string, postId: string) {
    return PostsRepository.isLikedByUser(userId, postId);
  }
}
