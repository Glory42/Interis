import { db } from "../../../infrastructure/database/db";
import { activities } from "../../social/social.entity";
import { buildPostCommentedActivityMetadata } from "../helpers/posts-activity.helper";
import { PostsRepository } from "../repositories/posts.repository";

export class PostsCommentsService {
  static async getComments(postId: string) {
    return PostsRepository.getComments(postId);
  }

  static async addComment(userId: string, postId: string, content: string) {
    const post = await PostsRepository.findPostById(postId);
    if (!post) {
      return null;
    }

    const comment = await PostsRepository.insertComment(userId, postId, content);

    if (comment) {
      await db.insert(activities).values({
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
      });
    }

    return comment;
  }

  static async deleteComment(commentId: string, userId: string) {
    return PostsRepository.deleteCommentByIdAndUser(commentId, userId);
  }
}
