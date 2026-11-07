import { and, desc, eq, gt, gte, lte, sql, type SQL } from "drizzle-orm";
import type { PgTable } from "drizzle-orm/pg-core";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import { profiles } from "../../users/users.entity";
import { reports } from "../../reports/reports.entity";
import { reviews, comments } from "../../reviews/reviews.entity";
import { posts, postComments } from "../../posts/posts.entity";
import { diaryEntries } from "../../diary/diary.entity";
import { seriesDiaryEntries } from "../../tv/tv.entity";
import { films } from "../../films/films.entity";
import { tvSeries } from "../../tv/tv.entity";
import { adminAuditLog } from "../admin-audit-log.entity";

const countRows = async (table: PgTable, where?: SQL): Promise<number> => {
  const [row] = await db
    .select({ count: sql<number>`count(*)`.mapWith(Number) })
    .from(table)
    .where(where);
  return row?.count ?? 0;
};

export class AdminOverviewRepository {
  static async pendingReports() {
    const [row] = await db
      .select({
        count: sql<number>`count(*)`.mapWith(Number),
        items: sql<number>`count(distinct (${reports.targetType}, ${reports.targetId}))`.mapWith(Number),
        oldest: sql<Date | null>`min(${reports.createdAt})`,
      })
      .from(reports)
      .where(eq(reports.status, "pending"));
    return {
      count: row?.count ?? 0,
      items: row?.items ?? 0,
      oldest: row?.oldest ? new Date(row.oldest) : null,
    };
  }

  static suspensionsEndingBy(until: Date): Promise<number> {
    return countRows(
      profiles,
      and(eq(profiles.isSuspended, true), gt(profiles.suspendedUntil, new Date()), lte(profiles.suspendedUntil, until)),
    );
  }

  // Each "since" count is one cheap COUNT(*); the created_at indexes serve most of them.
  static countsSince(since: Date) {
    return Promise.all([
      countRows(user, gte(user.createdAt, since)),
      countRows(diaryEntries, gte(diaryEntries.createdAt, since)),
      countRows(seriesDiaryEntries, gte(seriesDiaryEntries.createdAt, since)),
      countRows(reviews, gte(reviews.createdAt, since)),
      countRows(posts, gte(posts.createdAt, since)),
      countRows(comments, gte(comments.createdAt, since)),
      countRows(postComments, gte(postComments.createdAt, since)),
    ]);
  }

  static cachedMedia() {
    return Promise.all([countRows(films), countRows(tvSeries)]);
  }

  static latestActions(limit: number) {
    return db
      .select({
        action: adminAuditLog.action,
        targetLabel: adminAuditLog.targetLabel,
        actorUsername: adminAuditLog.actorUsername,
        createdAt: adminAuditLog.createdAt,
      })
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt), desc(adminAuditLog.id))
      .limit(limit);
  }
}
