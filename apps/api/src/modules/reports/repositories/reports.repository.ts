import { and, desc, eq } from "drizzle-orm";
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
      .set({ status, resolvedAt: new Date(), resolvedBy })
      .where(and(eq(reports.id, reportId), eq(reports.status, "pending")));
  }
}
