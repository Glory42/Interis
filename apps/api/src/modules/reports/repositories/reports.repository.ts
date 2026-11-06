import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "../../../infrastructure/database/db";
import { user } from "../../../infrastructure/database/auth.entity";
import {
  reports,
  type reportReasonEnum,
  type reportStatusEnum,
  type reportTargetTypeEnum,
} from "../reports.entity";

export type ReportTargetType = (typeof reportTargetTypeEnum.enumValues)[number];
export type ReportReason = (typeof reportReasonEnum.enumValues)[number];
export type ReportStatus = (typeof reportStatusEnum.enumValues)[number];

export class ReportsRepository {
  static async insert(input: {
    reporterId: string;
    targetType: ReportTargetType;
    targetId: string;
    contentSnapshot: string;
    reason: ReportReason;
    details?: string;
  }) {
    const [row] = await db
      .insert(reports)
      .values(input)
      .onConflictDoNothing()
      .returning();

    return row ?? null;
  }

  static async list(status: ReportStatus | undefined, limit: number, offset: number) {
    return db
      .select({
        id: reports.id,
        reporterId: reports.reporterId,
        reporterUsername: user.username,
        targetType: reports.targetType,
        targetId: reports.targetId,
        contentSnapshot: reports.contentSnapshot,
        reason: reports.reason,
        details: reports.details,
        status: reports.status,
        createdAt: reports.createdAt,
        resolvedAt: reports.resolvedAt,
      })
      .from(reports)
      .innerJoin(user, eq(reports.reporterId, user.id))
      .where(status ? eq(reports.status, status) : undefined)
      .orderBy(desc(reports.createdAt))
      .limit(limit)
      .offset(offset);
  }

  static async findById(reportId: string) {
    const [row] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
    return row ?? null;
  }

  static async updateStatus(
    reportId: string,
    status: "resolved" | "dismissed",
    resolvedBy: string,
  ) {
    await db
      .update(reports)
      .set({ status, resolvedAt: new Date(), resolvedBy, resolutionAction: status })
      .where(and(eq(reports.id, reportId), eq(reports.status, "pending")));
  }

  // Once content is removed, every open report on it is moot, not just the one acted on.
  static async resolvePendingForTarget(
    targetType: ReportTargetType,
    targetId: string,
    resolvedBy: string,
  ) {
    await db
      .update(reports)
      .set({ status: "resolved", resolvedAt: new Date(), resolvedBy, resolutionAction: "content_removed" })
      .where(
        and(
          eq(reports.targetType, targetType),
          eq(reports.targetId, targetId),
          eq(reports.status, "pending"),
        ),
      );
  }

  // One row per reported item: busiest first, then oldest first.
  static async listGrouped(status: ReportStatus, limit: number, offset: number) {
    const rows = await db.execute<{
      targetType: ReportTargetType;
      targetId: string;
      reportCount: number;
      reasons: ReportReason[];
      contentSnapshot: string;
      authorUsername: string | null;
      oldestReportAt: Date;
      latestReportAt: Date;
    }>(sql`
      SELECT
        r.target_type AS "targetType",
        r.target_id AS "targetId",
        count(*)::int AS "reportCount",
        array_agg(DISTINCT r.reason::text) AS "reasons",
        (array_agg(r.content_snapshot ORDER BY r.created_at DESC))[1] AS "contentSnapshot",
        min(u.username) AS "authorUsername",
        min(r.created_at) AS "oldestReportAt",
        max(r.created_at) AS "latestReportAt"
      FROM report r
      LEFT JOIN review rv ON r.target_type = 'review' AND rv.id::text = r.target_id
      LEFT JOIN post p ON r.target_type = 'post' AND p.id::text = r.target_id
      LEFT JOIN "user" u ON u.id = coalesce(rv.user_id, p.user_id)
      WHERE r.status = ${status}
      GROUP BY r.target_type, r.target_id
      ORDER BY count(*) DESC, min(r.created_at) ASC
      LIMIT ${limit} OFFSET ${offset}
    `);
    return rows.rows;
  }

  // Closes every pending report on one item at once.
  static async closePendingForTarget(input: {
    targetType: ReportTargetType;
    targetId: string;
    status: "resolved" | "dismissed";
    resolvedBy: string;
    note: string | null;
  }): Promise<number> {
    const updated = await db
      .update(reports)
      .set({
        status: input.status,
        resolvedAt: new Date(),
        resolvedBy: input.resolvedBy,
        resolutionAction: input.status,
        resolutionNote: input.note,
      })
      .where(
        and(
          eq(reports.targetType, input.targetType),
          eq(reports.targetId, input.targetId),
          eq(reports.status, "pending"),
        ),
      )
      .returning({ id: reports.id });
    return updated.length;
  }
}
