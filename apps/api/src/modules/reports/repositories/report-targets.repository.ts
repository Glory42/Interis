import { eq } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { comments } from "../../reviews/reviews.entity";
import { postComments } from "../../posts/posts.entity";
import { lists } from "../../lists/lists.entity";

// Comment and list ids are uuids; anything else can't exist, so it reads as not found.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ExtraReportTarget = "comment" | "post_comment" | "list";

export class ReportTargetsRepository {
  // The text a report keeps, so it stays reviewable after an edit or delete.
  static async snapshot(targetType: ExtraReportTarget, targetId: string): Promise<string | null> {
    if (!UUID.test(targetId)) return null;
    if (targetType === "list") {
      const [row] = await db.select({ title: lists.title, description: lists.description }).from(lists).where(eq(lists.id, targetId)).limit(1);
      return row ? [row.title, row.description].filter(Boolean).join(" — ") : null;
    }
    const table = targetType === "comment" ? comments : postComments;
    const [row] = await db.select({ content: table.content }).from(table).where(eq(table.id, targetId)).limit(1);
    return row?.content ?? null;
  }

  static async remove(targetType: ExtraReportTarget, targetId: string): Promise<void> {
    if (!UUID.test(targetId)) return;
    if (targetType === "list") {
      await db.delete(lists).where(eq(lists.id, targetId));
      return;
    }
    const table = targetType === "comment" ? comments : postComments;
    await db.delete(table).where(eq(table.id, targetId));
  }
}
