import type { CreatePostDto } from "./dto/posts.dto";
import { PostsCommentsService } from "./services/posts-comments.service";
import { PostsCoreService } from "./services/posts-core.service";
import { PostsLikesService } from "./services/posts-likes.service";

export class PostsService {
  static async create(userId: string, input: CreatePostDto) {
    return PostsCoreService.create(userId, input);
  }

  static async findById(postId: string) {
    return PostsCoreService.findById(postId);
  }

  static async findByUser(userId: string) {
    return PostsCoreService.findByUser(userId);
  }

  static async delete(postId: string, userId: string) {
    return PostsCoreService.delete(postId, userId);
  }

  static async like(userId: string, postId: string) {
    return PostsLikesService.like(userId, postId);
  }

  static async unlike(userId: string, postId: string) {
    return PostsLikesService.unlike(userId, postId);
  }

  static async isLiked(userId: string, postId: string) {
    return PostsLikesService.isLiked(userId, postId);
  }

  static async getComments(postId: string) {
    return PostsCommentsService.getComments(postId);
  }

  static async addComment(userId: string, postId: string, content: string) {
    return PostsCommentsService.addComment(userId, postId, content);
  }

  static async deleteComment(commentId: string, userId: string) {
    return PostsCommentsService.deleteComment(commentId, userId);
  }
}
