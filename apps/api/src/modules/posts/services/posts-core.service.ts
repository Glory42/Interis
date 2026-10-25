import { ActivityRecorder } from "../../social/services/activity-recorder.service";
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

    await ActivityRecorder.record({
      userId,
      type: "post",
      entityId: post.id,
      metadata: buildPostCreatedActivityMetadata({
        post: {
          id: post.id,
          content: post.content,
          mediaId: post.mediaId,
          mediaType: post.mediaType,
        },
      }),
    });

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
    ActivityRecorder.invalidateFeeds(userId);
    if (deleted) {
      await ActivityRecorder.retract({ userId, type: "post", entityId: postId });
    }
    return deleted;
  }

  static async deleteById(postId: string) {
    const deleted = await PostsRepository.deleteById(postId);
    if (deleted) {
      await ActivityRecorder.retract({ userId: deleted.userId, type: "post", entityId: postId });
    }
    return deleted;
  }

  static async listAllForAdmin(filters: { userId?: string }, limit: number, offset: number) {
    return PostsRepository.listAllForAdmin(filters, limit, offset);
  }

  static async update(postId: string, userId: string, input: UpdatePostDto) {
    const updated = await PostsRepository.updateByIdAndUser(postId, userId, input.content);
    ActivityRecorder.invalidateFeeds(userId);
    return updated;
  }
}
