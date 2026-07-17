import {
  pgTable,
  text,
  timestamp,
  uuid,
  unique,
  index,
  pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";

export const reportTargetTypeEnum = pgEnum("report_target_type", ["review", "post"]);

export const reportReasonEnum = pgEnum("report_reason", [
  "spam",
  "harassment",
  "inappropriate",
  "other",
]);

export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "resolved",
  "dismissed",
]);

export const reports = pgTable(
  "report",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: reportTargetTypeEnum("target_type").notNull(),
    targetId: text("target_id").notNull(),
    // Content snapshot at submit time, so a report stays reviewable even if
    // the underlying review/post is later edited or deleted.
    contentSnapshot: text("content_snapshot").notNull(),
    reason: reportReasonEnum("reason").notNull(),
    details: text("details"),
    status: reportStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
    resolvedBy: text("resolved_by").references(() => user.id, { onDelete: "set null" }),
  },
  (table) => [
    unique("reports_reporter_target_unique").on(
      table.reporterId,
      table.targetType,
      table.targetId,
    ),
    index("reports_status_created_idx").on(table.status, table.createdAt),
  ],
);
