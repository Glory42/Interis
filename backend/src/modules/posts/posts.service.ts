import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "../../infrastructure/database/db";
import { posts, postLikes, postComments } from "./posts.entity";
import { activities } from "../social/social.entity";
import { user } from "../../infrastructure/database/auth.entity";
import { profiles } from "../users/users.entity";
import type { CreatePostDto } from "./dto/posts.dto";

export class PostsService {
  private static async getPostFeedMetadata(postId: string) {
    const [post] = await db
      .select({
        id: posts.id,
        content: posts.content,
        mediaId: posts.mediaId,
        mediaType: posts.mediaType,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    return post ?? null;
  }

  static async create(userId: string, input: CreatePostDto) {
    const [post] = await db
      .insert(posts)
      .values({
        userId,
        content: input.content,
        mediaId: input.mediaId ?? null,
        mediaType: input.mediaType ?? null,
      })
      .returning();

    if (!post) {
      throw new Error("Could not create post");
    }

    // Write to activity feed — type "post"
    await db.insert(activities).values({
      userId,
      type: "post",
      entityId: post.id,
      metadata: JSON.stringify({
        postId: post.id,
        content: post.content,
        excerpt: input.content.slice(0, 120),
        mediaId: input.mediaId ?? null,
        mediaType: input.mediaType ?? null,
      }),
    });

    return post;
  }

  // Single post with like count + author info
  static async findById(postId: string) {
    const [row] = await db
      .select({
        post: posts,
        likeCount: sql<number>`count(${postLikes.postId})`.mapWith(Number),
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorAvatarUrl: profiles.avatarUrl,
      })
      .from(posts)
      .leftJoin(postLikes, eq(postLikes.postId, posts.id))
      .innerJoin(user, eq(posts.userId, user.id))
      .leftJoin(profiles, eq(posts.userId, profiles.userId))
      .where(eq(posts.id, postId))
      .groupBy(
        posts.id,
        user.username,
        user.displayUsername,
        profiles.avatarUrl,
      )
      .limit(1);

    if (!row) return null;

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

  // All posts by a user — for profile page
  static async findByUser(userId: string) {
    return db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }

  // Only the author can delete their own post
  static async delete(postId: string, userId: string) {
    const [deleted] = await db
      .delete(posts)
      .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
      .returning({ id: posts.id });

    return deleted ?? null;
  }

  // ── Likes ──────────────────────────────────────────────────────────────────
  static async like(userId: string, postId: string) {
    // Idempotent — silently ignores duplicate
    const [row] = await db
      .insert(postLikes)
      .values({ userId, postId })
      .onConflictDoNothing()
      .returning();

    if (row) {
      const postMetadata = await PostsService.getPostFeedMetadata(postId);

      if (postMetadata) {
        await db.insert(activities).values({
          userId,
          type: "commented",
          entityId: postId,
          metadata: JSON.stringify({
            action: "liked_post",
            postId: postMetadata.id,
            content: postMetadata.content,
            excerpt: postMetadata.content.slice(0, 120),
            mediaId: postMetadata.mediaId,
            mediaType: postMetadata.mediaType,
          }),
        });
      }
    }

    return { liked: true, wasNew: !!row };
  }

  static async unlike(userId: string, postId: string) {
    const [deleted] = await db
      .delete(postLikes)
      .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)))
      .returning({ postId: postLikes.postId });

    return deleted ?? null;
  }

  // Check like state — used by frontend to render button state
  static async isLiked(userId: string, postId: string) {
    const [row] = await db
      .select({ postId: postLikes.postId })
      .from(postLikes)
      .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)))
      .limit(1);

    return !!row;
  }

  // ── Comments ───────────────────────────────────────────────────────────────
  static async getComments(postId: string) {
    return db
      .select({
        comment: postComments,
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorAvatarUrl: profiles.avatarUrl,
      })
      .from(postComments)
      .innerJoin(user, eq(postComments.userId, user.id))
      .leftJoin(profiles, eq(postComments.userId, profiles.userId))
      .where(eq(postComments.postId, postId))
      .orderBy(postComments.createdAt);
  }

  static async addComment(userId: string, postId: string, content: string) {
    // Verify post exists
    const [post] = await db
      .select({
        id: posts.id,
        content: posts.content,
        mediaId: posts.mediaId,
        mediaType: posts.mediaType,
      })
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1);

    if (!post) return null;

    const [comment] = await db
      .insert(postComments)
      .values({ userId, postId, content })
      .returning();

    if (comment) {
      await db.insert(activities).values({
        userId,
        type: "commented",
        entityId: comment.id,
        metadata: JSON.stringify({
          action: "commented_post",
          postId: post.id,
          commentId: comment.id,
          content: post.content,
          excerpt: content.slice(0, 120),
          mediaId: post.mediaId,
          mediaType: post.mediaType,
        }),
      });
    }

    return comment;
  }

  static async deleteComment(commentId: string, userId: string) {
    const [deleted] = await db
      .delete(postComments)
      .where(
        and(eq(postComments.id, commentId), eq(postComments.userId, userId)),
      )
      .returning({ id: postComments.id });

    return deleted ?? null;
  }
}
