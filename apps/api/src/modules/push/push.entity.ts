import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { user } from "../../infrastructure/database/auth.entity";

// One row per browser/device a user turned push on for.
export const pushSubscriptions = pgTable(
  "push_subscription",
  {
    id: uuid("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    userAgent: text("user_agent"),
    failureCount: integer("failure_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    // Last subscribe or successful delivery, refreshed at most daily.
    lastUsedAt: timestamp("last_used_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("push_subscription_endpoint_unique").on(table.endpoint),
    index("push_subscription_user_last_used_idx").on(table.userId, table.lastUsedAt),
  ],
);

// No row means every category is on.
export const pushPreferences = pgTable("push_preference", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  follows: boolean("follows").default(true).notNull(),
  likes: boolean("likes").default(true).notNull(),
  comments: boolean("comments").default(true).notNull(),
  moderation: boolean("moderation").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
