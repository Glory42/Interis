import { SocialRepository } from "../../social/repositories/social.repository";
import { SocialFeedService } from "../../social/services/social-feed.service";
import type { CreatePostDto, UpdatePostDto } from "../dto/posts.dto";
import { buildPostCreatedActivityMetadata } from "../helpers/posts-activity.helper";
import { PostsRepository } from "../repositories/posts.repository";

export class PostsCoreService {
  static async create(userId: string, input: CreatePostDto) {
    const post = await PostsRepository.insertPost({
      userId,
      content: input.content,
      mediaId: input.mediaId ?? null,
      mediaType: input.mediaType ?? null,
    });

    if (!post) {
      throw new Error("Could not create post");
    }

    await SocialRepository.insertActivity({
      userId,
      type: "post",
      entityId: post.id,
      metadata: JSON.stringify(
        buildPostCreatedActivityMetadata({
          post: {
            id: post.id,
            content: post.content,
            mediaId: post.mediaId,
            mediaType: post.mediaType,
          },
        }),
      ),
    });

    SocialFeedService.invalidateFollowingFeed(userId);

    return post;
  }

  static async findById(postId: string) {
    const row = await PostsRepository.findById(postId);
    if (!row) {
      return null;
    }

    return {
      ...row.post,
      likeCount: row.likeCount,
      author: {
        username: row.authorUsername,
        displayUsername: row.authorDisplayUsername,
        avatarUrl: row.authorAvatarUrl,
      },
    };
  }

  static async findByUser(userId: string) {
    return PostsRepository.findByUser(userId);
  }

  static async delete(postId: string, userId: string) {
    const deleted = await PostsRepository.deleteByIdAndUser(postId, userId);
    SocialFeedService.invalidateFollowingFeed(userId);
    return deleted;
  }

  static async deleteById(postId: string) {
    return PostsRepository.deleteById(postId);
  }

  static async listAllForAdmin(filters: { userId?: string }, limit: number, offset: number) {
    return PostsRepository.listAllForAdmin(filters, limit, offset);
  }

  static async update(postId: string, userId: string, input: UpdatePostDto) {
    const updated = await PostsRepository.updateByIdAndUser(postId, userId, input.content);
    SocialFeedService.invalidateFollowingFeed(userId);
    return updated;
  }
}
