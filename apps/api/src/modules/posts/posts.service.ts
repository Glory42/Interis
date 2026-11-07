import type { ContentRemoval } from "../../commons/types/content-removal.types";
import type { CreatePostDto, UpdatePostDto } from "./dto/posts.dto";
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

  static async update(postId: string, userId: string, input: UpdatePostDto) {
    return PostsCoreService.update(postId, userId, input);
  }

  static async remove(postId: string, removal: ContentRemoval) {
    return PostsCoreService.remove(postId, removal);
  }

  static async listAllForAdmin(filters: { userId?: string }, limit: number, offset: number) {
    return PostsCoreService.listAllForAdmin(filters, limit, offset);
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

  static async removeComment(commentId: string, removal: ContentRemoval) {
    return PostsCommentsService.removeComment(commentId, removal);
  }

  static async updateComment(commentId: string, userId: string, content: string) {
    return PostsCommentsService.updateComment(commentId, userId, content);
  }
}
