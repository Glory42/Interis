import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { isUuid } from "../../../commons/helpers/uuid.helper";
import { comments } from "../../reviews/reviews.entity";
import { postComments } from "../../posts/posts.entity";
import { lists } from "../../lists/lists.entity";

export type ExtraReportTarget = "comment" | "post_comment" | "list";

export class ReportTargetsRepository {
  // The text a report keeps, so it stays reviewable after an edit or delete.
  static async snapshot(targetType: ExtraReportTarget, targetId: string): Promise<string | null> {
    if (!isUuid(targetId)) return null;
    if (targetType === "list") {
      const [row] = await db.select({ title: lists.title, description: lists.description }).from(lists).where(eq(lists.id, targetId)).limit(1);
      return row ? [row.title, row.description].filter(Boolean).join(" — ") : null;
    }
    const table = targetType === "comment" ? comments : postComments;
    const [row] = await db.select({ content: table.content }).from(table).where(eq(table.id, targetId)).limit(1);
    return row?.content ?? null;
  }
}
