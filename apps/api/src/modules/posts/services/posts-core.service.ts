import { ActivityRecorder } from "../../social/services/activity-recorder.service";
import type { CreatePostDto, UpdatePostDto } from "../dto/posts.dto";
import { buildPostCreatedActivityMetadata } from "../helpers/posts-activity.helper";
import { PostsRepository } from "../repositories/posts.repository";
import { NotificationsService } from "../../notifications/notifications.service";
import { isUuid } from "../../../commons/helpers/uuid.helper";
import { removalOwnerId, type ContentRemoval } from "../../../commons/types/content-removal.types";

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

  // The one way a post goes, whoever removes it.
  static async remove(postId: string, removal: ContentRemoval) {
    if (!isUuid(postId)) {
      return null;
    }

    const removed = await PostsRepository.deleteById(postId, removalOwnerId(removal));
    if (removed) {
      ActivityRecorder.invalidateFeeds(removed.userId);
      await Promise.all([
        ActivityRecorder.retract({ userId: removed.userId, type: "post", entityId: postId }),
        NotificationsService.notifyOfRemoval(removal, { authorId: removed.userId, id: postId, targetType: "post" }),
      ]);
    }
    return removed;
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
