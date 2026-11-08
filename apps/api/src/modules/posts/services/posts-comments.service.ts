import { ActivityRecorder } from "../../social/services/activity-recorder.service";
import { buildPostCommentedActivityMetadata } from "../helpers/posts-activity.helper";
import { PostsRepository } from "../repositories/posts.repository";
import { NotificationsService } from "../../notifications/notifications.service";
import { isUuid } from "../../../commons/helpers/uuid.helper";
import { removalOwnerId, type ContentRemoval } from "../../../commons/types/content-removal.types";

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
        ActivityRecorder.record({
          userId,
          type: "commented",
          entityId: comment.id,
          metadata: buildPostCommentedActivityMetadata({
            post,
            commentId: comment.id,
            commentContent: content,
          }),
        }),
        NotificationsService.notify({
          recipientId: post.userId,
          actorId: userId,
          type: "comment_post",
          entityId: postId,
        }),
      ]);
    }

    return comment;
  }

  // The one way a post comment goes, whoever removes it.
  static async removeComment(commentId: string, removal: ContentRemoval) {
    if (!isUuid(commentId)) {
      return null;
    }

    const removed = await PostsRepository.deleteComment(commentId, removalOwnerId(removal));
    if (removed) {
      await Promise.all([
        ActivityRecorder.retract({ userId: removed.userId, type: "commented", entityId: commentId }),
        NotificationsService.notifyOfRemoval(removal, { authorId: removed.userId, id: commentId, targetType: "post_comment" }),
      ]);
    }
    return removed;
  }

  static async updateComment(commentId: string, userId: string, content: string) {
    const updated = await PostsRepository.updateCommentByIdAndUser(commentId, userId, content);
    if (updated) {
      await ActivityRecorder.refreshExcerpt({ userId, type: "commented", entityId: commentId, content });
    }
    return updated;
  }
}
