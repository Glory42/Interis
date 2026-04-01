import { db } from "../../../infrastructure/database/db";
import { activities } from "../../social/social.entity";
import type { CreatePostDto } from "../dto/posts.dto";
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

    await db.insert(activities).values({
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
    return PostsRepository.deleteByIdAndUser(postId, userId);
  }
}
