import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";

// One row per admin write. Millisecond timestamps so the (created_at, id) cursor round-trips through JS Dates.
export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Kept as a name even after the admin account is deleted.
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    actorUsername: text("actor_username").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    targetLabel: text("target_label"),
    reason: text("reason"),
    createdAt: timestamp("created_at", { precision: 3 }).defaultNow().notNull(),
  },
  (table) => [
    index("admin_audit_log_created_idx").on(table.createdAt, table.id),
    index("admin_audit_log_actor_idx").on(table.actorId, table.createdAt),
    index("admin_audit_log_target_idx").on(table.targetType, table.targetId),
  ],
);
