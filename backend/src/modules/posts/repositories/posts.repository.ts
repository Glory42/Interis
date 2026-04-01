import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { postComments, postLikes, posts } from "../posts.entity";

export class PostsRepository {
  static async insertPost(input: {
    userId: string;
    content: string;
    mediaId: number | null;
    mediaType: "movie" | "tv" | "book" | "music" | null;
  }) {
    const [post] = await db
      .insert(posts)
      .values({
        userId: input.userId,
        content: input.content,
        mediaId: input.mediaId,
        mediaType: input.mediaType,
      })
      .returning();

    return post ?? null;
  }

  static async getPostFeedMetadata(postId: string) {
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

    return row ?? null;
  }

  static async findByUser(userId: string) {
    return db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
  }

  static async deleteByIdAndUser(postId: string, userId: string) {
    const [deleted] = await db
      .delete(posts)
      .where(and(eq(posts.id, postId), eq(posts.userId, userId)))
      .returning({ id: posts.id });

    return deleted ?? null;
  }

  static async insertLike(userId: string, postId: string) {
    const [row] = await db
      .insert(postLikes)
      .values({ userId, postId })
      .onConflictDoNothing()
      .returning();

    return row ?? null;
  }

  static async deleteLikeByUserAndPost(userId: string, postId: string) {
    const [deleted] = await db
      .delete(postLikes)
      .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)))
      .returning({ postId: postLikes.postId });

    return deleted ?? null;
  }

  static async isLikedByUser(userId: string, postId: string) {
    const [row] = await db
      .select({ postId: postLikes.postId })
      .from(postLikes)
      .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)))
      .limit(1);

    return !!row;
  }

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

  static async findPostById(postId: string) {
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

  static async insertComment(userId: string, postId: string, content: string) {
    const [comment] = await db
      .insert(postComments)
      .values({ userId, postId, content })
      .returning();

    return comment ?? null;
  }

  static async deleteCommentByIdAndUser(commentId: string, userId: string) {
    const [deleted] = await db
      .delete(postComments)
      .where(and(eq(postComments.id, commentId), eq(postComments.userId, userId)))
      .returning({ id: postComments.id });

    return deleted ?? null;
  }
}
