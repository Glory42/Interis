import { SocialRepository } from "../../social/repositories/social.repository";
import { SocialFeedService } from "../../social/services/social-feed.service";
import { buildPostCommentedActivityMetadata } from "../helpers/posts-activity.helper";
import { PostsRepository } from "../repositories/posts.repository";
import { NotificationsService } from "../../notifications/notifications.service";

export class PostsCommentsService {
  static async getComments(postId: string) {
    return PostsRepository.getComments(postId);
  }

  static async addComment(userId: string, postId: string, content: string) {
    const post = await PostsRepository.getPostFeedMetadata(postId);
    if (!post) {
      return null;
    }

    const comment = await PostsRepository.insertComment(userId, postId, content);

    if (comment) {
      await Promise.all([
        SocialRepository.insertActivity({
          userId,
          type: "commented",
          entityId: comment.id,
          metadata: JSON.stringify(
            buildPostCommentedActivityMetadata({
              post,
              commentId: comment.id,
              commentContent: content,
            }),
          ),
        }),
        NotificationsService.notify({
          recipientId: post.userId,
          actorId: userId,
          type: "comment_post",
          entityId: postId,
        }),
      ]);

      SocialFeedService.invalidateFollowingFeed(userId);
    }

    return comment;
  }

  static async deleteComment(commentId: string, userId: string) {
    return PostsRepository.deleteCommentByIdAndUser(commentId, userId);
  }

  static async updateComment(commentId: string, userId: string, content: string) {
    return PostsRepository.updateCommentByIdAndUser(commentId, userId, content);
  }
}
