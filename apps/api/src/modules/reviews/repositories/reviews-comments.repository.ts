import { and, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { comments } from "../reviews.entity";

export class ReviewsCommentsRepository {
  static async insertComment(input: { userId: string; reviewId: string; content: string }) {
    const [comment] = await db
      .insert(comments)
      .values({
        userId: input.userId,
        reviewId: input.reviewId,
        content: input.content,
      })
      .returning();

    return comment ?? null;
  }

  static async getCommentsByReviewId(reviewId: string) {
    return db
      .select({
        id: comments.id,
        userId: comments.userId,
        reviewId: comments.reviewId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorAvatarUrl: profiles.avatarUrl,
      })
      .from(comments)
      .innerJoin(user, eq(comments.userId, user.id))
      .leftJoin(profiles, eq(comments.userId, profiles.userId))
      .where(eq(comments.reviewId, reviewId))
      .orderBy(comments.createdAt);
  }

  static async getCommentWithAuthorById(commentId: string) {
    const [commentWithAuthor] = await db
      .select({
        id: comments.id,
        userId: comments.userId,
        reviewId: comments.reviewId,
        content: comments.content,
        createdAt: comments.createdAt,
        updatedAt: comments.updatedAt,
        authorUsername: user.username,
        authorDisplayUsername: user.displayUsername,
        authorAvatarUrl: profiles.avatarUrl,
      })
      .from(comments)
      .innerJoin(user, eq(comments.userId, user.id))
      .leftJoin(profiles, eq(comments.userId, profiles.userId))
      .where(eq(comments.id, commentId))
      .limit(1);

    return commentWithAuthor ?? null;
  }

  static async deleteCommentByIdAndUser(commentId: string, userId: string) {
    const [deleted] = await db
      .delete(comments)
      .where(and(eq(comments.id, commentId), eq(comments.userId, userId)))
      .returning({ id: comments.id });

    return deleted ?? null;
  }

  static async updateCommentByIdAndUser(commentId: string, userId: string, content: string) {
    const [updated] = await db
      .update(comments)
      .set({ content, updatedAt: new Date() })
      .where(and(eq(comments.id, commentId), eq(comments.userId, userId)))
      .returning({ id: comments.id });

    return updated ?? null;
  }
}
