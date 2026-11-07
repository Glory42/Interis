import { desc, eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { comments } from "../../reviews/reviews.entity";
import { postComments } from "../../posts/posts.entity";

export type AdminCommentKind = "review" | "post";

export class AdminCommentsRepository {
  // Newest comments of both kinds; each source fetches enough rows to cover offset + limit.
  static async listRecent(limit: number, offset: number) {
    const fetchCount = limit + offset;
    const [reviewRows, postRows] = await Promise.all([
      db
        .select({ id: comments.id, content: comments.content, createdAt: comments.createdAt, parentId: comments.reviewId, authorUsername: user.username })
        .from(comments)
        .innerJoin(user, eq(user.id, comments.userId))
        .orderBy(desc(comments.createdAt))
        .limit(fetchCount),
      db
        .select({ id: postComments.id, content: postComments.content, createdAt: postComments.createdAt, parentId: postComments.postId, authorUsername: user.username })
        .from(postComments)
        .innerJoin(user, eq(user.id, postComments.userId))
        .orderBy(desc(postComments.createdAt))
        .limit(fetchCount),
    ]);

    return [
      ...reviewRows.map((row) => ({ kind: "review" as const, ...row })),
      ...postRows.map((row) => ({ kind: "post" as const, ...row })),
    ]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(offset, offset + limit);
  }
}
