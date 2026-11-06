import { and, desc, eq, lt, or } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { adminAuditLog } from "../admin-audit-log.entity";

export type AdminAuditInsert = typeof adminAuditLog.$inferInsert;

export class AdminAuditRepository {
  static async insert(row: AdminAuditInsert) {
    await db.insert(adminAuditLog).values(row);
  }

  // Newest first, keyset-paged on (created_at, id).
  static async listPage(input: {
    actorId?: string;
    cursor?: { createdAt: Date; id: string };
    limit: number;
  }) {
    const conditions = [
      input.actorId ? eq(adminAuditLog.actorId, input.actorId) : undefined,
      input.cursor
        ? or(
            lt(adminAuditLog.createdAt, input.cursor.createdAt),
            and(eq(adminAuditLog.createdAt, input.cursor.createdAt), lt(adminAuditLog.id, input.cursor.id)),
          )
        : undefined,
    ].filter((condition) => condition !== undefined);

    return db
      .select()
      .from(adminAuditLog)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(adminAuditLog.createdAt), desc(adminAuditLog.id))
      .limit(input.limit + 1);
  }
}
